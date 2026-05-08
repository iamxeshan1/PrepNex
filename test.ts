import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

const configPath = path.join(process.cwd(), "firebase-applet-config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const app = initializeApp({ projectId: config.projectId });
const dbId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "(default)" 
  ? config.firestoreDatabaseId 
  : undefined;

const db = dbId ? getFirestore(app, dbId) : getFirestore(app);

async function test() {
  const subs = await db.collection("subscriptions").get();
  console.log("Subscriptions found:", subs.size);
}
test();
