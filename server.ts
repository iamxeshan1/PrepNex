import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import nodemailer from "nodemailer";
import fs from "fs";

dotenv.config();

// Ensure app is initialized at startup
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let config: any = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
}
console.log("[Config Debug] Loaded Firebase config. Project ID:", config.projectId, "Database ID:", config.firestoreDatabaseId);

// Initialize Admin SDK - use default credentials in Cloud Run
const firebaseApp = getApps().length === 0 ? initializeApp() : getApp();
console.log(`Firebase Admin SDK initialized successfully.`);

let _db: any = null;

function getDb() {
  if (_db) return _db;
  
  const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
    ? config.firestoreDatabaseId 
    : undefined;

  try {
    if (dbId) {
      console.log(`[Firestore Debug] Initializing with named database: ${dbId}`);
      _db = getFirestore(firebaseApp, dbId);
    } else {
      _db = getFirestore(firebaseApp);
      console.log("[Firestore Debug] Initializing with default database.");
    }
    return _db;
  } catch (err: any) {
    console.error(`[Firestore Debug] FATAL Firestore initialization failure:`, err.message);
    throw err;
  }
}

// Wrapper for collection to handle potential permission issues on named databases
const db = {
  collection: (name: string) => {
    const database = getDb();
    const originalCollection = database.collection(name);
    
    // We can't easily proxy the entire collection object, so we'll just handle it in the routes
    return originalCollection;
  }
};

const sendEmail = async (to: string, subject: string, html: string, fromNameOverride?: string) => {
  let user = process.env.EMAIL_USER || process.env.SMTP_USER || "prepnexedtech@gmail.com";
  let pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || "";

  // Only try to fetch from Firestore if environment variables aren't sufficient
  if (!pass) {
    try {
      console.log("[Email Service] EMAIL_PASS missing, attempting to fetch from Firestore settings/smtp...");
      const database = getDb();
      const settingsDoc = await database.collection("settings").doc("smtp").get();
      if (settingsDoc.exists) {
        const data = settingsDoc.data();
        if (data?.smtpEmail && data?.smtpPassword) {
          user = data.smtpEmail;
          pass = data.smtpPassword;
          console.log("[Email Service] Successfully loaded SMTP credentials from Firestore.");
        }
      }
    } catch (err: any) {
      console.warn("[Email Service] Failed to read SMTP settings from Firestore (Permission Denied?), will use default/env fallback:", err.message);
      // Don't throw here, let it try the fallback or throw the descriptive error later
    }
  }

  if (!pass) {
    throw new Error("SMTP credentials missing: Please set EMAIL_PASS in the AI Studio Settings > Secrets (with name EMAIL_PASS).");
  }

  const dynamicTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });

  const fromName = fromNameOverride || "Team PrepNex Edtech";
  console.log(`[Email Service] Sending email to: ${to}, subject: ${subject}`);
  
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

  app.get("/api/health-check", async (req, res) => {
    try {
      console.log(`[Health Check] Project: ${config.projectId}, DB: ${config.firestoreDatabaseId || "(default)"}`);
      console.log("[Health Check] Testing Firestore connection via Admin SDK...");
      const database = getDb();
      const snapshot = await database.collection("users").limit(1).get();
      
      res.json({ 
        status: "ok", 
        firestore: "connected",
        project: config.projectId,
        databaseId: config.firestoreDatabaseId || "(default)",
        userCount: snapshot.size,
        method: "Admin-SDK"
      });
    } catch (e: any) {
      console.error("[Health Check] FAILED:", e.message);
      res.status(500).json({ 
        status: "error", 
        firestore: "failed",
        project: config.projectId,
        error: e.message,
        code: e.code,
        method: "Admin-SDK"
      });
    }
  });

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

  const adminAuth = getAdminAuth(firebaseApp);

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

  app.post("/api/validate-coupon", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) return res.status(400).json({ error: "Coupon code is required" });

      const database = getDb();
      const couponsRef = database.collection("coupons");
      const normalizedCode = code.trim().toUpperCase();
      
      console.log(`[Coupon Debug] Validating coupon: "${normalizedCode}" in database: ${database.databaseId || "(default)"}`);
      
      try {
        const q = await couponsRef.where("code", "==", normalizedCode).get();

        if (q.empty) {
          console.log(`[Coupon Debug] Coupon "${normalizedCode}" not found in DB`);
          return res.status(404).json({ valid: false, message: "Invalid coupon code" });
        }

        const couponData = q.docs[0].data();
        const isActive = couponData.isActive === true || couponData.isActive === "true";
        
        if (!isActive) {
          console.log(`[Coupon Debug] Coupon "${normalizedCode}" is inactive`);
          return res.status(404).json({ valid: false, message: "This coupon is expired or disabled" });
        }

        console.log(`[Coupon Debug] Validated:`, couponData);
        res.json({ 
          valid: true, 
          discountType: couponData.discountType, 
          discountValue: couponData.discountValue 
        });
      } catch (queryErr: any) {
        console.error(`[Coupon Debug] Firestore error:`, queryErr.message);
        if (queryErr.message.includes("PERMISSION_DENIED") || queryErr.code === 7) {
          return res.status(500).json({ 
            error: "PERMISSION_DENIED", 
            message: `Server lacks permission to access Firestore collection 'coupons' in database: ${database.databaseId || "(default)"}. Please check your Firebase settings.`,
            details: queryErr.message
          });
        }
        throw queryErr;
      }
    } catch (error: any) {
      console.error("Coupon validation error:", error);
      res.status(500).json({ error: error.message || "Failed to validate coupon" });
    }
  });

  app.post("/api/create-order", async (req, res) => {
    console.log("Received create-order request:", req.body);
    try {
      const { amount: clientAmount, itemId, couponCode } = req.body;
      
      if (!clientAmount || !itemId) {
        return res.status(400).json({ error: "Amount and Item ID are required" });
      }

      // 1. Fetch item to verify original price (Security)
      const database = getDb();
      let originalPrice = 0;
      let itemName = "Package";

      if (itemId === "PREMIUM_PASS") {
        const settingsDoc = await database.collection("settings").doc("general").get();
        originalPrice = parseInt(settingsDoc.data()?.premiumPrice || "599");
        itemName = settingsDoc.data()?.premiumTitle || "Unlimited 1-Year Pass";
      } else {
        const examDoc = await database.collection("exams").doc(itemId).get();
        if (examDoc.exists) {
          originalPrice = examDoc.data()?.price || 0;
          itemName = examDoc.data()?.name || "Exam Package";
        } else {
          // Check liveTests if not in exams
          const liveTestDoc = await database.collection("liveTests").doc(itemId).get();
          if (liveTestDoc.exists) {
            originalPrice = liveTestDoc.data()?.price || 0;
            itemName = liveTestDoc.data()?.title || "Live Test";
          }
        }
      }

      if (originalPrice === 0) {
        return res.status(400).json({ error: "Invalid item or item is free" });
      }

      // 2. Apply Coupon server-side
      let finalAmount = originalPrice;
      if (couponCode) {
        const normalizedCoupon = couponCode.trim().toUpperCase();
        console.log(`[Order Debug] Applying coupon server-side: "${normalizedCoupon}" in database: ${database.databaseId || "(default)"}`);
        
        try {
          const couponQ = await database.collection("coupons").where("code", "==", normalizedCoupon).limit(1).get();
          if (!couponQ.empty) {
            const coupon = couponQ.docs[0].data();
            const isActive = coupon.isActive === true || coupon.isActive === "true";
            
            if (isActive) {
              console.log(`[Order Debug] Coupon "${normalizedCoupon}" applied.`);
              if (coupon.discountType === "percentage") {
                finalAmount = originalPrice - (originalPrice * (coupon.discountValue / 100));
              } else {
                finalAmount = Math.max(0, originalPrice - coupon.discountValue);
              }
            } else {
              console.log(`[Order Debug] Coupon "${normalizedCoupon}" is inactive.`);
            }
          } else {
            console.log(`[Order Debug] Coupon "${normalizedCoupon}" not found.`);
          }
        } catch (couponQueryErr: any) {
          console.warn(`[Order Debug] Failed to validate coupon due to permissions, ignoring coupon:`, couponQueryErr.message);
          // We don't fail the whole order creation, but we log the warning
        }
      }

      console.log(`Calculated server-side amount: ${finalAmount} (Original: ${originalPrice})`);
      
      const razorpay = await getRazorpay();
      
      const options = {
        amount: Math.round(finalAmount * 100), // Paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          itemId,
          itemName,
          couponCode: couponCode || "NONE"
        }
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("Order creation failed:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, itemId } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !userId || !itemId) {
        return res.status(400).json({ status: "failed", message: "Missing required details" });
      }

      let secret = process.env.RAZORPAY_KEY_SECRET || "";
      if (!secret) {
        try {
          const database = getDb();
          const settingsDoc = await database.collection("settings").doc("razorpay").get();
          secret = settingsDoc.data()?.razorpayKeySecret || "";
        } catch (err: any) {
          console.warn("Secret fetch failed:", err.message);
        }
      }

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");

      if (expectedSignature === razorpay_signature) {
        // PAYMENT SUCCESS -> Update User in Firestore
        const database = getDb();
        const userRef = database.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          if (itemId === "PREMIUM_PASS") {
            // Sitewide Premium Activation
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year validity
            
            await userRef.update({
              isPremium: true,
              subscriptionExpiry: expiryDate.toISOString()
            });

            await database.collection("subscriptions").add({
              userId,
              type: "global_premium",
              purchaseDate: new Date().toISOString(),
              expiryDate: expiryDate.toISOString(),
              paymentId: razorpay_payment_id,
              orderId: razorpay_order_id,
              paymentStatus: "completed",
              amount: 599 // Usually the price from create-order
            });
          } else {
            // Check if it's a live test or regular exam
            const liveTestRef = database.collection("liveTests").doc(itemId);
            const liveTestDoc = await liveTestRef.get();
            
            if (liveTestDoc.exists) {
              // It's a live test -> Enroll user
              const enrolledUsers = liveTestDoc.data()?.enrolledUsers || [];
              if (!enrolledUsers.includes(userId)) {
                enrolledUsers.push(userId);
                await liveTestRef.update({ enrolledUsers });
              }
            } else {
              // It's an exam package
              const userData = userDoc.data();
              const purchasedExams = userData?.purchasedExams || [];
              
              if (!purchasedExams.includes(itemId)) {
                purchasedExams.push(itemId);
                await userRef.update({ purchasedExams });
              }
            }
            
            // Record generic subscription/purchase log
            await database.collection("subscriptions").add({
              userId,
              examId: itemId, // Used for both exam and live test ID here
              purchaseDate: new Date().toISOString(),
              paymentId: razorpay_payment_id,
              orderId: razorpay_order_id,
              paymentStatus: "completed"
            });
          }
        }

        res.json({ status: "ok", message: "Purchase completed successfully" });
      } else {
        res.status(400).json({ status: "failed", message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      res.status(500).json({ error: "Verification error", detail: error.message });
    }
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"));
  
  if (!isProduction) {
    console.log("[Server] Starting in DEVELOPMENT mode with Vite middleware.");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Starting in PRODUCTION mode.");
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from dist
    app.use(express.static(distPath, { index: false }));
    
    // Fallback for SPA: serve index.html for any route that isn't a static file or API
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Application build not found. Please run 'npm run build' first.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
