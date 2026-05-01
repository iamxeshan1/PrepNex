import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import nodemailer from "nodemailer";
import fs from "fs";

dotenv.config();

let _db: any = null;

function getDb() {
  if (_db) return _db;
  
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    let config: any = {};
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    // Try to initialize without explicit config if GOOGLE_APPLICATION_CREDENTIALS might be present
    // or if we are in a GCP environment that handles it.
    if (getApps().length === 0) {
      if (config.projectId) {
        initializeApp({ 
          projectId: config.projectId,
          // credential: admin.credential.applicationDefault() // Removed for better compatibility
        });
        console.log("Firestore initialized with config projectId:", config.projectId);
      } else {
        initializeApp();
        console.log("Firestore initialized with default environment config");
      }
    }
    
    const app = getApp();
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
    if (getApps().length === 0) initializeApp();
    _db = getFirestore();
    return _db;
  }
}

// Helper to use db safely
const db = {
  collection: (name: string) => getDb().collection(name)
};

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
    console.error("Failed to read dynamic smtp settings, falling back to env vars:", err);
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
    console.error("Error fetching Razorpay settings from Firestore:", error.message || error);
    
    // If it was a permission error, explain likely cause
    if (error.message?.includes("PERMISSION_DENIED") || (error.code === 7)) {
      console.error("CRITICAL: Server lacks permission to read Firestore 'settings/razorpay'. Please ensure the Razorpay ID and Secret are set in the AI Studio Settings (Secrets) panel as VITE_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
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
