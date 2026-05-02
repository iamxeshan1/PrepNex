import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { initializeApp, getApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";
import fs from "fs";
import { initializeApp as initializeClientApp } from "firebase/app";
import { getAuth as getClientAuth, sendPasswordResetEmail as sendClientPasswordResetEmail } from "firebase/auth";
import clientConfig from "./firebase-applet-config.json";

dotenv.config();

// Ensure app is initialized at startup
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let config: any = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
}

const firebaseApp = initializeApp({
  projectId: config.projectId,
});
console.log("Firebase App initialized with project:", config.projectId);

let _db: any = null;

function getDb() {
  if (_db) return _db;
  
  try {
    const app = firebaseApp;
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let config: any = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
    
    const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
      ? config.firestoreDatabaseId 
      : undefined;

    if (dbId) {
      _db = getFirestore(app, dbId);
      console.log("Firestore using named database:", dbId);
    } else {
      _db = getFirestore(app);
      console.log("Firestore using default database");
    }
    
    return _db;
  } catch (err) {
    console.error("Firestore initialization failed:", err);
    throw err;
  }
}

// Helper to use db safely
const db = {
  collection: (name: string) => getDb().collection(name)
};

const sendEmail = async (to: string, subject: string, html: string, fromNameOverride?: string) => {
  let user = process.env.EMAIL_USER || "prepnexedtech@gmail.com";
  let pass = process.env.EMAIL_PASS || "";

  // Only try to fetch from Firestore if environment variables aren't sufficient
  if (!pass) {
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
      console.error("Failed to read SMTP settings from Firestore, relying solely on environment variables:", err);
    }
  }

  if (!pass) {
    throw new Error("SMTP credentials missing: EMAIL_PASS environment variable or Firestore settings required.");
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
    from: user,
    to,
    subject,
    html,
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let razorpayInstance: Razorpay | null = null;

async function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  
  // Try Environment Variables FIRST as they are most reliable in this environment
  const envKeyId = process.env.VITE_RAZORPAY_KEY_ID || "";
  const envKeySecret = process.env.RAZORPAY_KEY_SECRET || "";

  if (envKeyId && envKeySecret) {
    console.log("Initializing Razorpay using environment variables.");
    razorpayInstance = new Razorpay({
      key_id: envKeyId,
      key_secret: envKeySecret,
    });
    return razorpayInstance;
  }
  
  try {
    console.log("Fetching Razorpay settings from Firestore...");
    const database = getDb();
    const settingsDoc = await database.collection("settings").doc("razorpay").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : null;
    
    const keyId = settings?.razorpayKeyId || "";
    const keySecret = settings?.razorpayKeySecret || "";

    if (!keyId || !keySecret) {
      console.warn("Razorpay keys missing in both Environment and Firestore.");
      throw new Error("Razorpay configuration missing");
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    return razorpayInstance;
  } catch (error: any) {
    console.warn("Could not fetch Razorpay settings from Firestore:", error.message || error);
    
    // If it was a permission error, explain likely cause
    if (error.message?.includes("PERMISSION_DENIED") || (error.code === 7)) {
      console.warn("Note: Server lacks IAM permission to read user's Firestore 'settings/razorpay'. Please set VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in AI Studio Settings (Secrets).");
    }

    throw new Error("Razorpay not configured on server. Please add VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to Settings > Secrets.");
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
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; color: #334155; padding: 40px; background-color: #f1f5f9; border-radius: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h1 style="color: #4f46e5; margin-bottom: 20px;">Welcome to PrepNex Edtech!</h1>
            <p style="font-size: 16px; margin-bottom: 15px;">Hi <strong>${name || 'Aspirant'}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">We are thrilled to have you join our community! Get ready to supercharge your learning journey.</p>
            <div style="margin: 30px 0;">
              <a href="https://ais-dev-jiogqd5sd2opeeg53i55h6-95891610099.asia-southeast1.run.app" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Start Learning</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">With regards,<br><strong>Team PrepNex Edtech</strong></p>
          </div>
        </div>
      `;
      await sendEmail(email, "Welcome to PrepNex Edtech!", html);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  const clientApp = initializeClientApp(clientConfig);
const clientAuth = getClientAuth(clientApp);
const adminAuth = getAdminAuth(firebaseApp);

  app.post("/api/send-reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Generate the password reset link via admin SDK
      const appUrl = process.env.VITE_APP_URL || 'https://ais-dev-jiogqd5sd2opeeg53i55h6-95891610099.asia-southeast1.run.app';
      const resetLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${appUrl}/login`
      });

      // Extract the oobCode from the Firebase generated link
      const url = new URL(resetLink);
      const oobCode = url.searchParams.get("oobCode");

      if (!oobCode) throw new Error("Failed to generate reset code");

      const customResetLink = `${appUrl}/reset-password?oobCode=${oobCode}`;

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; color: #334155; padding: 40px; background-color: #f1f5f9; border-radius: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h1 style="color: #4f46e5; margin-bottom: 20px;">Reset Your Password</h1>
            <p style="font-size: 16px; margin-bottom: 15px;">We received a request to reset your password for PrepNex Edtech.</p>
            <p style="font-size: 16px; margin-bottom: 25px;">Click the button below to set a new password:</p>
            <div style="margin: 30px 0;">
              <a href="${customResetLink}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">If you didn't request this, you can safely ignore this email.</p>
            <p style="font-size: 14px; color: #64748b; margin-top: 20px;">With regards,<br><strong>Team PrepNex Edtech</strong></p>
          </div>
        </div>
      `;

      await sendEmail(email, "Reset your password - PrepNex Edtech", html);
      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to process reset request" });
    }
  });


  app.post("/api/admin/send-promotional", async (req, res) => {
    try {
      const { subject, body, emails, fromName } = req.body;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 40px; background-color: #f1f5f9; border-radius: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              ${body.replace(/\n/g, '<br/>')}
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 30px;">With regards,<br><strong>${fromName || "Team PrepNex Edtech"}</strong></p>
          </div>
        </div>
      `;
      for (const email of emails) {
        await sendEmail(email, subject, html, fromName);
      }
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send emails" });
    }
  });

  // API Routes
  app.get("/api/payment-status", async (req, res) => {
    try {
      const razorpay = await getRazorpay();
      res.json({ configured: true, keyId: (razorpay as any).key_id });
    } catch (error: any) {
      res.status(500).json({ configured: false, error: error.message });
    }
  });

  app.post("/api/create-order", async (req, res) => {
    console.log("Received create-order request:", req.body);
    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      if (!amount) {
        console.error("Amount missing in request");
        return res.status(400).json({ error: "Amount is required" });
      }

      console.log("Initializing Razorpay...");
      const razorpay = await getRazorpay();
      
      console.log("Creating Razorpay order...");
      const options = {
        amount: Math.round(amount * 100), // Razorpay expects paise
        currency,
        receipt,
      };

      const order = await razorpay.orders.create(options);
      console.log("Order created successfully:", order.id);
      res.json(order);
    } catch (error: any) {
      console.error("Order creation failed error detail:", error);
      res.status(500).json({ 
        error: "Failed to create order", 
        message: error.message || "Internal Server Error",
        detail: process.env.NODE_ENV !== 'production' ? error.toString() : undefined
      });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ status: "failed", message: "Missing payment details" });
      }

      let secret = process.env.RAZORPAY_KEY_SECRET || "";
      if (!secret) {
        try {
          const database = getDb();
          const settingsDoc = await database.collection("settings").doc("razorpay").get();
          secret = settingsDoc.data()?.razorpayKeySecret || "";
        } catch (err: any) {
          console.warn("Failed to fetch Razorpay secret from Firestore for verification:", err.message);
        }
      }

      if (!secret) {
        console.error("Razorpay secret missing during verification");
        return res.status(500).json({ status: "failed", message: "Verification config error. Please set RAZORPAY_KEY_SECRET in AI Studio Secrets." });
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
