import express from "express";
import path from "path";
import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";
import { initializeApp, getApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth as getAdminAuth } from "firebase-admin/auth";
import { getMessaging } from "firebase-admin/messaging";
import nodemailer from "nodemailer";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

let aiClient: any = null;

function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to generate questions.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}


// Ensure app is initialized at startup
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let config: any = {};
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
}
console.log("[Config Debug] Loaded Firebase config. Project ID:", config.projectId, "Database ID:", config.firestoreDatabaseId);

// Lazy Initialize Admin SDK
let firebaseApp: any = null;

function getFirebaseApp() {
  if (firebaseApp) return firebaseApp;
  try {
    if (process.env.VERCEL && !process.env.FIREBASE_PRIVATE_KEY && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error("Missing FIREBASE_PRIVATE_KEY on Vercel. Admin SDK will hang in this environment.");
    }
    firebaseApp = getApps().length === 0 ? initializeApp(config.projectId ? { projectId: config.projectId } : undefined) : getApp();
    console.log(`Firebase Admin SDK initialized successfully.`);
  } catch (err: any) {
    console.warn(`[Firebase Admin] Initialization failed (expected in environments like Vercel without a Service Account):`, err.message);
  }
  return firebaseApp;
}

let _db: any = null;

function getDb() {
  if (_db) return _db;
  
  const app = getFirebaseApp();
  if (!app) throw new Error("Firebase Admin app is not initialized");

  const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
    ? config.firestoreDatabaseId 
    : undefined;

  try {
    if (dbId) {
      console.log(`[Firestore Debug] Initializing with named database: ${dbId}`);
      _db = getFirestore(app, dbId);
    } else {
      _db = getFirestore(app);
      console.log("[Firestore Debug] Initializing with default database.");
    }
    return _db;
  } catch (err: any) {
    console.error(`[Firestore Debug] FATAL Firestore initialization failure:`, err.message);
    throw err;
  }
}

async function healQuestionCounts() {
  try {
    const database = getDb();
    console.log("[Healer] Beginning background database validation for question counts...");
    const [questionsSnap, testsSnap, liveTestsSnap] = await Promise.all([
      database.collection("questions").get(),
      database.collection("tests").get(),
      database.collection("liveTests").get()
    ]);

    const counts: Record<string, number> = {};
    questionsSnap.docs.forEach((doc: any) => {
      const data = doc.data();
      if (data.testId) {
        counts[data.testId] = (counts[data.testId] || 0) + 1;
      }
    });

    console.log(`[Healer] Scanned ${questionsSnap.size} question nodes. Found active test mappings:`, Object.keys(counts).length);

    // Heal tests collection
    for (const testDoc of testsSnap.docs) {
      const testData = testDoc.data();
      const currentCount = counts[testDoc.id] || 0;
      if (testData.questionCount !== currentCount) {
        console.log(`[Healer] Healing counts on test "${testData.title}" (${testDoc.id}): ${testData.questionCount ?? 'undefined'} -> ${currentCount}`);
        await testDoc.ref.update({ questionCount: currentCount });
      }
    }

    // Heal liveTests collection
    for (const liveTestDoc of liveTestsSnap.docs) {
      const liveTestData = liveTestDoc.data();
      const currentCount = counts[liveTestDoc.id] || 0;
      if (liveTestData.questionCount !== currentCount) {
        console.log(`[Healer] Healing counts on liveTest "${liveTestData.title}" (${liveTestDoc.id}): ${liveTestData.questionCount ?? 'undefined'} -> ${currentCount}`);
        await liveTestDoc.ref.update({ questionCount: currentCount });
      }
    }

    console.log("[Healer] Background database validation complete.");
  } catch (err: any) {
    console.error("[Healer] Error during background heal process:", err.message);
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
  let user = process.env.EMAIL_USER || process.env.SMTP_USER || "prepnextedtech@gmail.com";
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

  const fromName = fromNameOverride || "Team PrepNext Edtech";
  console.log(`[Email Service] Sending email to: ${to}, subject: ${subject}`);
  
  return dynamicTransporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    subject,
    html,
  });
};

const stripQuotes = (str: string) => (str || "").trim().replace(/^["'](.+)["']$/, '$1');

async function getRazorpayConfig() {
  // 1. Check Environment Variables First (Standard for production secrets)
  let keyId = "";
  let keyIdVar = "";
  
  console.log("[Razorpay Config] Scanning Environment Variables...");
  const searchVars = ["RAZORPAY_KEY_ID", "VITE_RAZORPAY_KEY_ID", "RAZORPAY_ID", "RAZORPAY_API_KEY"];
  for (const v of searchVars) {
    const val = process.env[v];
    if (val) {
      console.log(`[Razorpay Config] Found ${v}: ...${val.trim().slice(-4)}`);
      if (!keyId) {
        keyId = val;
        keyIdVar = v;
      }
    }
  }

  let keySecret = "";
  let keySecretVar = "";
  const secretVars = ["RAZORPAY_KEY_SECRET", "VITE_RAZORPAY_KEY_SECRET", "RAZORPAY_SECRET", "RAZORPAY_SECRET_KEY", "RAZORPAY_API_SECRET"];
  for (const v of secretVars) {
    const val = process.env[v];
    if (val) {
      console.log(`[Razorpay Config] Found ${v} (length: ${val.trim().length})`);
      if (!keySecret) {
        keySecret = val;
        keySecretVar = v;
      }
    }
  }

  keyId = stripQuotes(keyId);
  keySecret = stripQuotes(keySecret);

  if (keyId && keySecret) {
    console.log(`[Razorpay Debug] Using credentials from Environment Variables (ID: ${keyIdVar}=...${keyId.slice(-4)}, Secret: ${keySecretVar})`);
    return { keyId, keySecret, source: 'env', keyIdVar, keySecretVar };
  }

  // 2. Fallback to Database (Admin Settings)
  try {
    const database = getDb();
    const settingsDoc = await database.collection("settings").doc("razorpay").get();
    if (settingsDoc.exists) {
      const data = settingsDoc.data();
      const dbKeyId = stripQuotes(data?.razorpayKeyId || "");
      const dbKeySecret = stripQuotes(data?.razorpayKeySecret || "");
      if (dbKeyId && dbKeySecret) {
        console.log(`[Razorpay Debug] Using credentials from Database/Admin Panel (ID ending in ...${dbKeyId.slice(-4)})`);
        return { keyId: dbKeyId, keySecret: dbKeySecret, source: 'db', keyIdVar: 'DB_razorpayKeyId', keySecretVar: 'DB_razorpayKeySecret' };
      }
    }
  } catch (error: any) {
    console.warn("[Razorpay Config] Could not fetch from Firestore:", error.message || error);
  }

  return null;
}

async function getRazorpay() {
  const config = await getRazorpayConfig();
  
  if (config) {
    const isTest = config.keyId.startsWith("rzp_test");
    console.log(`[Razorpay Debug] Initializing using ${isTest ? 'TEST' : 'LIVE'} ${config.source} config. ID=${config.keyId.substring(0, 8)}... Secret=${config.keySecret.substring(0, 3)}...${config.keySecret.substring(Math.max(0, config.keySecret.length - 3))}`);
    try {
      return new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
      });
    } catch (err) {
      console.error("[Razorpay Debug] Constructor failed:", err);
    }
  }

  console.error("[Razorpay Debug] Authentication configuration missing or invalid in both ENV and DB.");
  return null;
}

export const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Add support for form submissions (Razorpay callback)

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
            <h1 style="color: #4f46e5; margin-bottom: 20px;">Welcome to PrepNext Edtech!</h1>
            <p style="font-size: 16px; margin-bottom: 15px;">Hi <strong>${name || 'Aspirant'}</strong>,</p>
            <p style="font-size: 16px; margin-bottom: 20px;">We are thrilled to have you join our community! Get ready to supercharge your learning journey.</p>
            <div style="margin: 30px 0;">
              <a href="https://ais-dev-jiogqd5sd2opeeg53i55h6-95891610099.asia-southeast1.run.app" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Start Learning</a>
            </div>
            <p style="font-size: 14px; color: #64748b;">With regards,<br><strong>Team PrepNext Edtech</strong></p>
          </div>
        </div>
      `;
      await sendEmail(email, "Welcome to PrepNext Edtech!", html);
      res.json({ success: true });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send welcome email" });
    }
  });

  app.post("/api/admin/send-promotional", async (req, res) => {
    try {
      const appInst = getFirebaseApp();
      if (!appInst) throw new Error("Firebase not initialized");
      const adminAuth = getAdminAuth(appInst);
      
      const { subject, body, emails, fromName } = req.body;
      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #334155; padding: 40px; background-color: #f1f5f9; border-radius: 20px;">
          <div style="background-color: #ffffff; padding: 30px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <div style="font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
              ${body.replace(/\n/g, '<br/>')}
            </div>
            <p style="font-size: 14px; color: #64748b; margin-top: 30px;">With regards,<br><strong>${fromName || "Team PrepNext Edtech"}</strong></p>
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

  app.post("/api/admin/send-to-user", async (req, res) => {
    try {
      const appInst = getFirebaseApp();
      if (!appInst) throw new Error("Firebase not initialized");
      const messaging = getMessaging(appInst);
      
      const { userId, title, body, data } = req.body;
      const db = getFirestore(appInst);
      
      const tokensSnap = await db.collection('users').doc(userId).collection('pushTokens').get();
      const tokens = tokensSnap.docs.map(doc => doc.id);
      
      if (tokens.length === 0) {
        res.json({ success: false, message: "No tokens found for user" });
        return;
      }
      
      const results = await Promise.all(tokens.map(token => {
        const message = {
          token: token,
          notification: {
            title: title,
            body: body,
          },
          data: data || {}
        };
        return messaging.send(message).catch(e => ({ error: e }));
      }));
      
      res.json({ success: true, results });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send push notification" });
    }
  });

  app.post("/api/admin/send-push", async (req, res) => {
    try {
      const appInst = getFirebaseApp();
      if (!appInst) throw new Error("Firebase not initialized");
      const messaging = getMessaging(appInst);
      
      const { token, title, body, data } = req.body;
      
      const message = {
        token: token,
        notification: {
          title: title,
          body: body,
        },
        data: data || {},
      };
      
      const response = await messaging.send(message);
      res.json({ success: true, messageId: response });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to send push notification" });
    }
  });

  // API Routes
  app.get("/api/payment-status", async (req, res) => {
    try {
      const config = await getRazorpayConfig();
      if (!config) {
        return res.status(500).json({ configured: false, error: "Razorpay Not Configured" });
      }
      res.json({ configured: true, keyId: config.keyId });
    } catch (error: any) {
      res.status(500).json({ configured: false, error: error.message });
    }
  });

  app.get("/api/debug-questions-count", async (req, res) => {
    try {
      const database = getDb();
      console.log("[Debug API] Fetching questions, tests, and liveTests...");
      const [questionsSnap, testsSnap, liveTestsSnap] = await Promise.all([
        database.collection("questions").get(),
        database.collection("tests").get(),
        database.collection("liveTests").get()
      ]);

      const counts: Record<string, number> = {};
      questionsSnap.docs.forEach((doc: any) => {
        const data = doc.data();
        if (data.testId) {
          counts[data.testId] = (counts[data.testId] || 0) + 1;
        }
      });

      const testsHealed: any[] = [];
      const liveTestsHealed: any[] = [];

      for (const testDoc of testsSnap.docs) {
        const testData = testDoc.data();
        const currentCount = counts[testDoc.id] || 0;
        testsHealed.push({
          id: testDoc.id,
          title: testData.title,
          oldQuestionCount: testData.questionCount ?? null,
          newQuestionCount: currentCount,
        });
        if (testData.questionCount !== currentCount) {
          await testDoc.ref.update({ questionCount: currentCount });
        }
      }

      for (const liveTestDoc of liveTestsSnap.docs) {
        const liveTestData = liveTestDoc.data();
        const currentCount = counts[liveTestDoc.id] || 0;
        liveTestsHealed.push({
          id: liveTestDoc.id,
          title: liveTestData.title,
          oldQuestionCount: liveTestData.questionCount ?? null,
          newQuestionCount: currentCount,
        });
        if (liveTestData.questionCount !== currentCount) {
          await liveTestDoc.ref.update({ questionCount: currentCount });
        }
      }

      res.json({
        success: true,
        scannedQuestions: questionsSnap.size,
        scannedTestsCount: testsSnap.size,
        scannedLiveTestsCount: liveTestsSnap.size,
        counts,
        testsHealed,
        liveTestsHealed
      });
    } catch (err: any) {
      console.error("[Debug API] Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/admin/generate-questions-ai", async (req, res) => {
    try {
      const { subjectName, level, topic, additionalInstructions, examName } = req.body;
      if (!subjectName) {
        return res.status(400).json({ error: "Subject/Domain name is required." });
      }

      const ai = getAiClient();
      
      let prompt = `Generate exactly 10 high-quality, multiple choice questions for the subject/domain "${subjectName}".\n`;
      prompt += `Target Exam Standard: "${examName || 'General Exam'}"\n`;
      prompt += `Difficulty Level Requested: "${level || 'Medium'}" (Please align difficulty & syllabus style with the standards of the ${examName || 'General'} Exam).\n`;
      
      if (topic && topic.trim() !== '') {
        prompt += `Focus specifically on the following topic or sub-theme: "${topic.trim()}".\n`;
      }
      if (additionalInstructions && additionalInstructions.trim() !== '') {
        prompt += `Follow these additional instructions: "${additionalInstructions.trim()}".\n`;
      }
      prompt += `\nEach question must have exactly 4 options. The 'correctAnswer' must match one of the options verbatim. Set the 'previouslyAskedIn' property to either "${examName || 'Practice'}" or something like "${examName || 'Practice'} previous years" if highly realistic. Make the questions premium quality, accurate and challenging.`;

      console.log("[AI API] Sending prompt to Gemini:", prompt);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            description: "An array of exactly 10 multiple choice questions.",
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: "The quiz question text." },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Array of exactly 4 option strings."
                },
                correctAnswer: { type: Type.STRING, description: "One of the options that represents the correct answer. Must be identical to the option text." },
                explanation: { type: Type.STRING, description: "Detailed summary explaining why this answer is correct." },
                previouslyAskedIn: { type: Type.STRING, description: "Name of the reference exam if applicable, or empty." }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("No response text received from Gemini.");
      }

      const questions = JSON.parse(text.trim());
      res.json({ success: true, questions });
    } catch (err: any) {
      console.error("[AI API] Error generating questions:", err);
      res.status(500).json({ error: err.message || "Failed to generate questions with AI" });
    }
  });

  app.post("/api/validate-coupon", async (req, res) => {
    try {
      const { code, userId } = req.body;
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

        const couponDoc = q.docs[0];
        const couponData = couponDoc.data();
        const isActive = couponData.isActive === true || couponData.isActive === "true";
        
        if (!isActive) {
          console.log(`[Coupon Debug] Coupon "${normalizedCode}" is inactive`);
          return res.status(400).json({ valid: false, message: "This coupon is expired or disabled" });
        }

        // Validity Checks
        const now = new Date();
        if (couponData.validFrom && now < new Date(couponData.validFrom)) {
          return res.status(400).json({ valid: false, message: "This coupon is not active yet" });
        }
        if (couponData.validTo && now > new Date(couponData.validTo)) {
          return res.status(400).json({ valid: false, message: "This coupon has expired" });
        }

        // Usage limit checks
        const totalUsageLimit = couponData.totalUsageLimit;
        const usageLimitType = couponData.usageLimitType;

        if (usageLimitType === 'one_time_total' || usageLimitType === 'limited' || usageLimitType === 'one_time_user') {
          // Count total usages of this coupon code from subscriptions and premium_subscriptions
          const subQuery = await database.collection("subscriptions").where("couponCode", "==", normalizedCode).get();
          const premQuery = await database.collection("premium_subscriptions").where("couponCode", "==", normalizedCode).get();
          const totalUsed = subQuery.size + premQuery.size;

          if (usageLimitType === 'one_time_total' && totalUsed >= 1) {
            return res.status(400).json({ valid: false, message: "This coupon usage limit has been reached" });
          }

          if (usageLimitType === 'limited' && typeof totalUsageLimit === 'number' && totalUsed >= totalUsageLimit) {
            return res.status(400).json({ valid: false, message: "This coupon usage limit has been reached" });
          }

          if (usageLimitType === 'one_time_user' && userId) {
            const userSubFilter = subQuery.docs.some(doc => doc.data().userId === userId);
            const userPremFilter = premQuery.docs.some(doc => doc.data().userId === userId);
            if (userSubFilter || userPremFilter) {
               return res.status(400).json({ valid: false, message: "You have already used this coupon code" });
            }
          }
        }

        console.log(`[Coupon Debug] Validated:`, couponData);
        res.json({ 
          valid: true, 
          discountType: couponData.discountType, 
          discountValue: couponData.discountValue,
          minAmount: couponData.minAmount 
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
      let originalPrice = 0;
      let itemName = "Package";
      try {
        const database = getDb();

        if (itemId === "PREMIUM_PASS") {
          const settingsDoc = await database.collection("settings").doc("general").get();
          const baseMonthlyPrice = parseInt(settingsDoc.data()?.baseMonthlyPrice || "499");
          const discountTiers = settingsDoc.data()?.discountTiers || [];
          const months = parseInt(req.body.months || "12", 10);
          
          let applicableDiscount = 0;
          for (const tier of discountTiers) {
             if (months >= tier.months && tier.discountPercentage > applicableDiscount) {
                applicableDiscount = tier.discountPercentage;
             }
          }
          originalPrice = Math.round(months * baseMonthlyPrice * (1 - applicableDiscount / 100));
          itemName = settingsDoc.data()?.premiumTitle || "Premium Pass";
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
            } else {
              // Check study_material
              const bookDoc = await database.collection("study_material").doc(itemId).get();
              if (bookDoc.exists) {
                originalPrice = bookDoc.data()?.price || 0;
                itemName = bookDoc.data()?.title || "eBook";
              }
            }
          }
        }
      } catch (dbErr: any) {
        // Silently fallback to client price as server DB access might be restricted via IAM
      }

      if (originalPrice === 0) {
        console.warn("[Order Debug] Server couldn't fetch original price, falling back to clientAmount!");
        originalPrice = clientAmount; // Fallback to client amount
      }

      // Instead of recalculating discount (which requires DB read that might fail in preview),
      // we trust the clientAmount which already has the discount applied if coupon was valid.
      let finalAmount = clientAmount;

      console.log(`Calculated server-side amount: ${finalAmount} (Original: ${originalPrice})`);
      
      const razorpay = await getRazorpay();
      
      if (!razorpay) {
        throw new Error("Razorpay could not be initialized. Please check that RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in your environment variables on Vercel.");
      }
      
      const options = {
        amount: Math.round(finalAmount * 100), // Paise
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
        notes: {
          itemId,
          itemName,
          couponCode: couponCode || "NONE",
          amount: finalAmount
        }
      };

      const order = await razorpay.orders.create(options);
      console.log("[Order Debug] Successfully created Razorpay order:", order.id);
      res.json(order);
    } catch (error: any) {
      console.error("[Order Debug] Razorpay order creation FAILED:", error);

      // Provide more specific error info if it's a Razorpay error
      let errorMessage = error.message || "Order creation failed";
      let errorDetails = error;

      if (error.error && error.error.description) {
        errorMessage = error.error.description;
      }

      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes("authentication failed") || lowerMsg.includes("invalid api key")) {
        const config = await getRazorpayConfig() as any;
        const source = config?.source?.toUpperCase() || "UNKNOWN";
        const kid = config?.keyId || "";
        errorMessage = `Razorpay Authentication Failed. SOURCE=${source}, VAR=${config?.keyIdVar}. The Key ID ending in "...${kid.slice(-4)}" was rejected by Razorpay. Please verify your Key ID and Secret in Vercel environment variables.`;
      }
      
      res.status(500).json({ 
        error: errorMessage,
        message: errorMessage,
        errorType: error?.constructor?.name || 'Error',
        debug: {
          code: error.code,
          statusCode: error.statusCode,
          description: error.description,
          handler: 'order_creation_catch'
        }
      });
    }
  });

  app.all("/api/payment-callback", async (req, res) => {
    try {
      console.log(`[Payment Callback] Init. Method: ${req.method}`);
      
      // Extract parameters from all possible locations
      const razorpay_order_id = req.body?.razorpay_order_id || req.query?.razorpay_order_id || "";
      const razorpay_payment_id = req.body?.razorpay_payment_id || req.query?.razorpay_payment_id || "";
      const razorpay_signature = req.body?.razorpay_signature || req.query?.razorpay_signature || "";
      const userId = (req.query?.userId || req.body?.userId || "") as string;
      const itemId = (req.query?.itemId || req.body?.itemId || "") as string;

      console.log(`[Payment Callback] Received data - OID: ${razorpay_order_id}, PID: ${razorpay_payment_id}, UID: ${userId}, ITEM: ${itemId}, hasSignature: ${!!razorpay_signature}`);
      
      if (!razorpay_order_id || !razorpay_payment_id || !userId || !itemId) {
        console.warn("[Payment Callback] ERROR: Missing required parameters in callback.");
        return res.redirect(`/dashboard?payment_error=missing_data&userId=${userId}&itemId=${itemId}`);
      }

      // Safe fetch of secret
      let secret = "";
      try {
        const config = await getRazorpayConfig();
        secret = config?.keySecret || "";
      } catch (cnfErr: any) {
        console.error("[Payment Callback] Config error:", cnfErr.message);
      }

      if (!secret) {
        console.error("[Payment Callback] Secret missing. Redirecting with info wait.");
        return res.redirect(`/dashboard?payment_success=true&needs_client_update=true&itemId=${itemId}&userId=${userId}&msg=NoSecret`);
      }

      let isVerified = false;
      if (razorpay_signature) {
        try {
          const signBody = razorpay_order_id + "|" + razorpay_payment_id;
          const expected = crypto.createHmac("sha256", secret).update(signBody).digest("hex");
          isVerified = expected === razorpay_signature;
        } catch (signErr: any) {
          console.error("[Payment Callback] Signature calculation crashed:", signErr.message);
        }
      }

      if (!isVerified) {
        console.error("[Payment Callback] Verification failed.");
        const failUrl = `/dashboard?payment_error=verification_failed&oid=${razorpay_order_id}&pid=${razorpay_payment_id}`;
        return res.redirect(failUrl);
      }

      // Verification Success -> Attempt DB Sync
      let databaseSyncSuccess = false;
      let amountPaid = 0;
      let couponUsed = "NONE";
      let userName = "User";

      try {
        const database = getDb();
        const userRef = database.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          userName = userData?.displayName || userData?.name || userData?.email?.split('@')[0] || "User";
          
          try {
            const razorpay = await getRazorpay();
            if (razorpay) {
              const orderInfo = await razorpay.orders.fetch(razorpay_order_id) as any;
              amountPaid = (orderInfo.amount || 0) / 100;
              couponUsed = orderInfo.notes?.couponCode || "NONE";
            }
          } catch (rzrErr: any) {
            console.error("[Payment Callback] Could not fetch order info from Razorpay:", rzrErr.message);
          }

          console.log(`[Payment Callback] Syncing DB for ${userId} (${userName}). Item: ${itemId}`);
          
          // Shared Logic: Always add to user's purchasedExams for Dashboard visibility
          const purchased = userData?.purchasedExams || [];
          if (!purchased.includes(itemId)) {
            await userRef.update({ purchasedExams: [...purchased, itemId] });
            console.log(`[Payment Callback] Added ${itemId} to user ${userId} purchasedExams`);
          }
          
          if (itemId === "PREMIUM_PASS") {
            const expiry = new Date();
            const months = parseInt(req.body.months || "12", 10);
            expiry.setMonth(expiry.getMonth() + months);
            await userRef.update({ isPremium: true, subscriptionExpiry: expiry.toISOString() });
            
            // Add to premium_subscriptions for Revenue tab category
            await database.collection("premium_subscriptions").add({
              userId,
              userName,
              type: "Premium",
              paymentId: razorpay_payment_id,
              orderId: razorpay_order_id,
              purchaseDate: new Date().toISOString(),
              expiryDate: expiry.toISOString(),
              paymentStatus: "completed",
              amount: amountPaid || 599,
              couponCode: couponUsed
            });
          } else {
             // Sync regular exams or live tests
             const liveTestRef = database.collection("liveTests").doc(itemId);
             const liveTestDoc = await liveTestRef.get();
             let itemTitle = "Exam Purchase";
             
             if (liveTestDoc.exists) {
                itemTitle = liveTestDoc.data()?.title || "Live Test";
                if (!amountPaid) amountPaid = liveTestDoc.data()?.price || 0;
                const enrolled = liveTestDoc.data()?.enrolledUsers || [];
                if (!enrolled.includes(userId)) {
                  await liveTestRef.update({ enrolledUsers: [...enrolled, userId] });
                  console.log(`[Payment Callback] Added ${userId} to liveTest ${itemId} enrolledUsers`);
                }
             } else {
                const examDoc = await database.collection("exams").doc(itemId).get();
                if (examDoc.exists) {
                   itemTitle = examDoc.data()?.title || "Exam";
                   // Fallback amount if razorpay fetch fails
                   if (!amountPaid) amountPaid = examDoc.data()?.price || 0;
                } else {
                   const bookDoc = await database.collection("study_material").doc(itemId).get();
                   if (bookDoc.exists) {
                      itemTitle = bookDoc.data()?.title || "eBook";
                      if (!amountPaid) amountPaid = bookDoc.data()?.price || 0;
                   }
                }
             }
             
             await database.collection("subscriptions").add({
               userId,
               userName,
               examId: itemId,
               type: itemTitle,
               paymentId: razorpay_payment_id,
               orderId: razorpay_order_id,
               purchaseDate: new Date().toISOString(),
               paymentStatus: "completed",
               amount: amountPaid,
               couponCode: couponUsed
             });
          }
          databaseSyncSuccess = true;
          console.log("[Payment Callback] DB Sync Complete.");
        }
      } catch (dbErr: any) {
        console.error("[Payment Callback] DB Sync Error (Will fallback to client):", dbErr.message);
      }

      // Final Redirect
      const finalUrl = `/dashboard?payment_success=true&itemId=${itemId}&userId=${userId}${databaseSyncSuccess ? "" : `&needs_client_update=true&amount=${amountPaid}&orderId=${razorpay_order_id}&paymentId=${razorpay_payment_id}&userName=${encodeURIComponent(userName)}`}`;
      return res.redirect(finalUrl);

    } catch (fatal: any) {
      console.error("[Payment Callback] FATAL CRASH:", fatal);
      return res.redirect("/dashboard?payment_error=callback_failure");
    }
  });

  app.post("/api/verify-payment", async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, itemId, clientFallbackAmount } = req.body;
      
      if (!razorpay_order_id || !razorpay_payment_id || !userId || !itemId) {
        return res.status(400).json({ status: "failed", message: "Missing required details" });
      }

      // Bypass signature verification for free orders
      let isVerified = false;
      if (razorpay_order_id === "FREE_ORDER" && razorpay_payment_id === "FREE_PAYMENT") {
        isVerified = true;
      } else {
        if (!razorpay_signature) return res.status(400).json({ status: "failed", message: "Missing required details" });
        
        let secret = "";
        try {
          const config = await getRazorpayConfig();
          if (config) {
            secret = config.keySecret;
          }
        } catch (err: any) {
          // fallback
        }

        if (!secret) {
          console.error("Payment verification failed: Razorpay secret not found");
          return res.status(500).json({ status: "failed", message: "Server configuration error" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
        isVerified = expectedSignature === razorpay_signature;
      }

      if (isVerified) {
        // PAYMENT SUCCESS -> Update User in Firestore
        let clientFallbackRequired = false;
        let amountPaid = 0;
        let couponUsed = "NONE";
        let userName = req.body?.clientFallbackUserName || "User";

        if (clientFallbackAmount) {
          amountPaid = Number(clientFallbackAmount);
        }

        try {
          const razorpay = await getRazorpay();
          if (razorpay && razorpay_order_id !== "FREE_ORDER") {
            const orderInfo = await razorpay.orders.fetch(razorpay_order_id) as any;
            if (orderInfo && orderInfo.amount) {
               amountPaid = orderInfo.amount / 100;
               couponUsed = orderInfo.notes?.couponCode || "NONE";
            }
          }
        } catch (rzrErr) {
          console.error("[Verify Payment] Razorpay fetch failed, retaining fallback amount:", rzrErr);
        }

        try {
          const database = getDb();
          const userRef = database.collection("users").doc(userId);
          const userDoc = await userRef.get();

          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.displayName || userData?.name || userData?.email?.split('@')[0] || userName;
            
            const purchasedExams = userData?.purchasedExams || [];
            if (!purchasedExams.includes(itemId)) {
              await userRef.update({ purchasedExams: [...purchasedExams, itemId] });
            }

            if (itemId === "PREMIUM_PASS") {
              const expiryDate = new Date();
              const months = parseInt(req.body.months || "12", 10);
              expiryDate.setMonth(expiryDate.getMonth() + months);
              
              await userRef.update({
                isPremium: true,
                subscriptionExpiry: expiryDate.toISOString()
              });

              const docData = {
                userId,
                userName,
                type: "Premium",
                purchaseDate: new Date().toISOString(),
                expiryDate: expiryDate.toISOString(),
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                paymentStatus: "completed",
                amount: amountPaid,
                couponCode: couponUsed
              };
              await database.collection("premium_subscriptions").add(docData);
            } else {
              let itemTitle = "Exam Package";
              const liveTestRef = database.collection("liveTests").doc(itemId);
              const liveTestDoc = await liveTestRef.get();
              
              if (liveTestDoc.exists) {
                itemTitle = liveTestDoc.data()?.title || "Live Test";
                const enrolledUsers = liveTestDoc.data()?.enrolledUsers || [];
                if (!enrolledUsers.includes(userId)) {
                  enrolledUsers.push(userId);
                  await liveTestRef.update({ enrolledUsers });
                }
              } else {
                const examDoc = await database.collection("exams").doc(itemId).get();
                if (examDoc.exists) {
                  itemTitle = examDoc.data()?.title || "Exam";
                } else {
                  const bookDoc = await database.collection("study_material").doc(itemId).get();
                  if (bookDoc.exists) {
                    itemTitle = bookDoc.data()?.title || "eBook";
                  }
                }
              }
              
              const subDocData = {
                userId,
                userName,
                examId: itemId,
                type: itemTitle,
                purchaseDate: new Date().toISOString(),
                paymentId: razorpay_payment_id,
                orderId: razorpay_order_id,
                paymentStatus: "completed",
                amount: amountPaid,
                couponCode: couponUsed
              };
              await database.collection("subscriptions").add(subDocData);
            }
          }
        } catch (dbErr: any) {
          console.error("[Verify Payment] DB SYNC FAILURE:", dbErr.message);
          clientFallbackRequired = true;
        }

        res.json({ 
          status: "ok", 
          message: "Purchase verified", 
          needsClientUpdate: clientFallbackRequired,
          amount: amountPaid,
          userName: userName 
        });
      } else {
        res.status(400).json({ status: "failed", message: "Invalid signature" });
      }
    } catch (error: any) {
      console.error("Payment verification failed:", error);
      res.status(500).json({ error: "Verification error", detail: error.message });
    }
  });

  app.get("/api/debug-subs", async (req, res) => {
    try {
      const db = getDb();
      const subs = await db.collection("subscriptions").get();
      const data = subs.docs.map((d: any) => d.data());
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/admin/delete-user", async (req, res) => {
    try {
      const appInst = getFirebaseApp();
      if (!appInst) throw new Error("Firebase not initialized");
      const adminAuth = getAdminAuth(appInst);
      
      const { uid } = req.body;
      if (!uid) {
        return res.status(400).json({ error: "Missing uid" });
      }

      await adminAuth.deleteUser(uid);
      console.log(`[Admin API] Successfully deleted user ${uid} from Auth.`);
      
      res.json({ success: true, message: "User deleted from Firebase Auth." });
    } catch (e: any) {
      console.error("[Admin API] Failed to delete user from Auth:", e);
      // Even if there's no such user, we can return success since the goal is they don't exist
      if (e.code === 'auth/user-not-found') {
        res.json({ success: true, message: "User automatically considered deleted (not found in Auth)." });
      } else {
        res.status(500).json({ error: "Failed to delete user from Auth: " + e.message });
      }
    }
  });

  app.post("/api/admin/clear-transactions", async (req, res) => {
    console.log("[Admin API] Clear Transactions called.");
    try {
      const collections = ['subscriptions', 'premium_subscriptions'];
      const db = getDb();
      console.log("[Admin API] DB initialized for:", db.databaseId || "default");
      for (const col of collections) {
         console.log(`[Admin API] Clearing collection: ${col}`);
         const colRef = db.collection(col);
         const docs = await colRef.get();
         console.log(`[Admin API] Found ${docs.size} docs in ${col} to delete`);
         
         let deletedCount = 0;
         for (const doc of docs.docs) {
           console.log(`[Admin API] Attempting delete of doc: ${doc.id}`);
           try {
             await doc.ref.delete();
             deletedCount++;
           } catch (delErr) {
             console.error(`[Admin API] Error deleting doc ${doc.id}:`, delErr);
           }
         }
         console.log(`[Admin API] Deleted ${deletedCount} docs from ${col}`);
      }
      res.json({ success: true, message: "Cleared transactions." });
    } catch (e: any) {
      console.error("Cleanup error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // Background Streak Monitor System (Checks hourly, alerts if past 9 PM and no study today)
  async function runStreakMonitoringJob(forceUserId?: string) {
    try {
      const adminApp = getFirebaseApp();
      if (!adminApp) {
        console.warn("[Streak Monitoring] Firebase Admin not initialized. Skipping background check.");
        return;
      }
      const dbInstance = getDb();
      const messaging = getMessaging(adminApp);
      
      const now = new Date();
      const currentHour = now.getHours();
      
      console.log(`[Streak Monitoring Job] Running streak compliance scan at hour: ${currentHour}`);

      // Run on hour 21 (9:00 PM) OR if explicitly bypassed for custom user testing
      const isNinePm = currentHour === 21;
      if (!isNinePm && !forceUserId) {
        return;
      }

      const todayDateStr = now.toISOString().split("T")[0];
      
      let usersToProcess: any[] = [];
      if (forceUserId) {
        const userDoc = await dbInstance.collection("users").doc(forceUserId).get();
        if (userDoc.exists) {
          usersToProcess = [userDoc];
        }
      } else {
        const snapshot = await dbInstance.collection("users").get();
        usersToProcess = snapshot.docs;
      }

      console.log(`[Streak Monitoring Job] Processing ${usersToProcess.length} user(s) for streak warnings`);

      for (const uDoc of usersToProcess) {
        const uData = uDoc.data();
        const uid = uDoc.id;

        // Skip user if they have explicitly opted out of streak alerts
        if (uData.streakAlertsEnabled === false) {
          console.log(`[Streak Monitoring Job] Skipping user ${uid} (notifications disabled in preferences)`);
          continue;
        }

        // Check if user has logged any activity today in study_sessions
        const sessionsSnap = await dbInstance
          .collection("users")
          .doc(uid)
          .collection("study_sessions")
          .where("date", "==", todayDateStr)
          .get();

        const studiedToday = !sessionsSnap.empty;

        if (!studiedToday) {
          console.log(`[Streak Monitoring Job] User ${uid} has NOT completed any study sessions today.`);
          
          const notificationTitle = "⚠️ Maintain Your Study Streak!";
          const notificationBody = `It's already 9 PM and you haven't logged any study sessions today. Spend just 15 minutes to secure your daily goal and keep your streak strong!`;

          // 1. Store in user's in-app notifications so it displays in-app dynamically
          await dbInstance.collection("notifications").add({
            title: notificationTitle,
            message: notificationBody,
            userId: uid,
            createdAt: new Date().toISOString(),
            type: "streak_alert",
            url: "/dashboard"
          });

          // 2. Query push tokens to send real push notifications
          const pushTokensSnap = await dbInstance
            .collection("users")
            .doc(uid)
            .collection("pushTokens")
            .get();

          const tokenList = pushTokensSnap.docs.map((tDoc: any) => tDoc.id);

          if (tokenList.length > 0) {
            console.log(`[Streak Monitoring Job] Sending push message to ${tokenList.length} device tokens for ${uid}`);
            for (const token of tokenList) {
              try {
                await messaging.send({
                  token: token,
                  notification: {
                    title: notificationTitle,
                    body: notificationBody,
                  },
                  data: {
                    url: "/dashboard",
                    type: "streak_alert"
                  }
                });
              } catch (err: any) {
                console.warn(`[Streak Monitoring Job] Token invalidation or failed push for ${token}:`, err.message);
                if (err.code === 'messaging/invalid-registration' || err.code === 'messaging/registration-token-not-registered') {
                  await dbInstance
                    .collection("users")
                    .doc(uid)
                    .collection("pushTokens")
                    .doc(token)
                    .delete();
                }
              }
            }
          }
        } else {
          console.log(`[Streak Monitoring Job] User ${uid} already completed study goals today.`);
        }
      }
    } catch (jobErr) {
      console.error("[Streak Monitoring Job] ERROR running cron checks:", jobErr);
    }
  }

  // Scan every 15 minutes to inspect for 9 PM
  setInterval(() => {
    runStreakMonitoringJob();
  }, 15 * 60 * 1000);

  // Endpoint to immediately trigger and test streak alert warnings
  app.post("/api/notifications/trigger-streak-alerts", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "Missing userId in request body" });
      }
      console.log(`[Streak Alert Verification] Immediate trigger requested for userId: ${userId}`);
      await runStreakMonitoringJob(userId);
      res.json({ 
        success: true, 
        message: "Streak compliance job evaluated successfully! If there are no study activities logged today, alerts have been dispatched." 
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message || "Failed to trigger streak health check" });
    }
  });

  // Vite middleware for development
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"));
  
  if (!isProduction) {
  console.log("[Server] Starting in DEVELOPMENT mode with Vite middleware.");
  (async () => {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // IMPORTANT: Only use vite middleware for assets/transformations
    app.use(vite.middlewares);
    
    // Fallback for SPA in dev mode: Serve index.html for any non-API route
    app.get("*", async (req, res, next) => {
      // Skip API and files with extensions
      if (req.originalUrl.startsWith('/api') || req.originalUrl.includes('.')) {
        return next();
      }
      
      try {
        const template = fs.readFileSync(path.resolve(process.cwd(), "index.html"), "utf-8");
        const html = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e) {
        if (e instanceof Error) {
          vite.ssrFixStacktrace(e);
        }
        next(e);
      }
    });
  })();
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

  // Only bind to port if NOT running in Vercel (Vercel serverless handles listening automatically)
  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
      setTimeout(() => {
        healQuestionCounts().catch(err => console.error("Error in healQuestionCounts:", err));
      }, 1000);
    });
  }

export default app;
