import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => { const [k, ...v] = l.split("="); return [k.trim(), v.join("=").trim().replace(/^"|"$/g, "")]; })
);

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

const ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY;

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const STORY_ID = process.argv[2] || "1771907858754";

async function translateText(text, targetLang) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: Math.max(200, text.length * 2),
      system: `Translate the following text to ${targetLang === "es" ? "Spanish" : "English"}. Output ONLY the translated text, nothing else. Preserve paragraph breaks, formatting, and tone.`,
      messages: [{ role: "user", content: text }],
    }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

async function main() {
  const key = `story-${STORY_ID}-data-v1`;
  const snap = await getDoc(doc(db, "storage", key));
  if (!snap.exists()) {
    console.error("Story not found:", key);
    process.exit(1);
  }

  const data = JSON.parse(snap.data().value);
  console.log(`Found ${data.length} passages for story ${STORY_ID}`);

  let changed = false;
  for (let i = 0; i < data.length; i++) {
    const entry = data[i];
    const hasEs = !!entry.text_es;
    const hasEn = !!entry.text_en;

    if (!hasEs && entry.text) {
      console.log(`Passage ${i}: missing text_es, translating...`);
      const tr = await translateText(entry.text, "es");
      entry.text_es = tr;
      if (!entry.text_en) entry.text_en = entry.text;
      changed = true;
      console.log(`  -> "${tr.slice(0, 80)}..."`);
    } else if (!hasEn && entry.text) {
      console.log(`Passage ${i}: missing text_en, translating...`);
      const tr = await translateText(entry.text, "en");
      entry.text_en = tr;
      if (!entry.text_es) entry.text_es = entry.text;
      changed = true;
      console.log(`  -> "${tr.slice(0, 80)}..."`);
    } else {
      console.log(`Passage ${i}: OK`);
    }
  }

  if (changed) {
    await setDoc(doc(db, "storage", key), { value: JSON.stringify(data) });
    console.log("\nSaved updated story to Firestore.");
  } else {
    console.log("\nAll passages already translated.");
  }

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
