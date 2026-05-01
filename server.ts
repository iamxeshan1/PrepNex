import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import admin from "firebase-admin";
import nodemailer from "nodemailer";

dotenv.config();

// Initialize Firebase Admin
admin.initializeApp({
  projectId: "gen-lang-client-0262811054", // From firebase-applet-config.json
});

const db = admin.firestore();

const sendEmail = async (to: string, subject: string, html: string, fromNameOverride?: string) => {
  let user = process.env.EMAIL_USER || "prepnexedtech@gmail.com";
  let pass = process.env.EMAIL_PASS || "";

  try {
    const settingsDoc = await db.collection("settings").doc("smtp").get();
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      if (data?.smtpEmail && data?.smtpPassword) {
        user = data.smtpEmail;
        pass = data.smtpPassword;
      }
    }
  } catch (err) {
    console.error("Failed to read dynamic smtp settings, falling back to env vars");
  }

  const dynamicTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const fromName = fromNameOverride || "Team PrepNex Edtech";
  return dynamicTransporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    subject,
    html,
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getRazorpay() {
  try {
    const settingsDoc = await db.collection("settings").doc("razorpay").get();
    const settings = settingsDoc.data();
    
    const keyId = settings?.razorpayKeyId || process.env.VITE_RAZORPAY_KEY_ID || "";
    const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "";

    if (!keyId || !keySecret) {
      console.warn("Razorpay keys missing in both Firestore and Environment.");
    }

    return new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  } catch (error) {
    console.error("Error fetching Razorpay settings:", error);
    // Fallback to env
    return new Razorpay({
      key_id: process.env.VITE_RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.post("/api/send-welcome", async (req, res) => {
    try {
      const { email, name } = req.body;
      const html = `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #1e293b; padding: 20px;">
          <h1 style="color: #4f46e5;">Welcome to PrepNex Edtech!</h1>
          <p>Hi ${name || 'Aspirant'},</p>
          <p>We are thrilled to have you here. Good luck with your preparation!</p>
          <p style="margin-top: 30px;">With regards,</p>
          <h3 style="color: #4f46e5; margin-top: 5px;">Team PrepNex Edtech</h3>
        </div>
      `;
      await sendEmail(email, "Welcome to PrepNex Edtech", html);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  app.post("/api/send-reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      // Generate password reset link via Firebase Admin
      const link = await admin.auth().generatePasswordResetLink(email);
      const html = `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #1e293b; padding: 30px; border-radius: 12px; background-color: #f8fafc;">
          <h2 style="color: #4f46e5;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Reset Password</a>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="margin-top: 30px;">With regards,</p>
          <h3 style="color: #4f46e5; margin-top: 5px;">Team PrepNex Edtech</h3>
        </div>
      `;
      await sendEmail(email, "Reset Your PrepNex Password", html);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send password reset email" });
    }
  });

  app.post("/api/admin/send-promotional", async (req, res) => {
    try {
      const { subject, body, emails, fromName } = req.body;
      const html = `
        <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 20px;">
          ${body.replace(/\n/g, '<br/>')}
          <p style="margin-top: 30px;">With regards,</p>
          <h3 style="color: #4f46e5; margin-top: 5px;">${fromName || "Team PrepNex Edtech"}</h3>
        </div>
      `;
      for (const email of emails) {
        await sendEmail(email, subject, html, fromName);
      }
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to send emails" });
    }
  });

  // API Routes
  app.post("/api/create-order", async (req, res) => {
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      if (!amount) {
        return res.status(400).json({ error: "Amount is required" });
      }

      const razorpay = await getRazorpay();
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency,
        receipt,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error) {
      console.error("Order creation failed:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ status: "failed", message: "Missing payment details" });
      }

      const settingsDoc = await db.collection("settings").doc("razorpay").get();
      const secret = settingsDoc.data()?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || "";

      if (!secret) {
        console.error("Razorpay secret missing during verification");
        return res.status(500).json({ status: "failed", message: "Verification config error" });
      }

      const body = razorpay_order_id.toString() + "|" + razorpay_payment_id.toString();
      const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        res.json({ status: "ok", message: "Payment verified successfully" });
      } else {
        res.status(400).json({ status: "failed", message: "Invalid signature" });
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      res.status(500).json({ error: "Verification error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
