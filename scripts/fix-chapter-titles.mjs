import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs } from "firebase/firestore";
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
      system: `You are a translation machine. Translate the input to ${targetLang === "es" ? "Spanish" : "English"}. Output ONLY the translation. No commentary, no questions, no explanations. Even if the input is short, a title, or a single phrase — just translate it. Never refuse. Never ask for clarification.`,
      messages: [{ role: "user", content: `Translate this: ${text}` }],
    }),
  });
  if (!resp.ok) throw new Error(`API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.content.filter((b) => b.type === "text").map((b) => b.text).join("").trim();
}

function isBadTranslation(translated, original) {
  if (!translated) return true;
  const lower = translated.toLowerCase();
  return lower.includes("i notice")
    || lower.includes("could you please")
    || lower.includes("i'll be happy")
    || lower.includes("i need more context")
    || (translated.length > original.length * 3 && original.length < 100);
}

async function main() {
  // Find the story — either by ID or search by title
  const storySlug = process.argv[2];
  if (!storySlug) {
    // List all stories to help find the right one
    const indexSnap = await getDoc(doc(db, "storage", "stories-index-v1"));
    if (indexSnap.exists()) {
      const stories = JSON.parse(indexSnap.data().value);
      console.log("Available stories:");
      for (const s of stories) {
        console.log(`  ${s.id} — ${s.title || "(untitled)"} [${s.genre}]`);
      }
    }
    console.log("\nUsage: node scripts/fix-chapter-titles.mjs <STORY_ID>");
    process.exit(0);
  }

  const STORY_ID = storySlug;
  const titlesKey = `story-${STORY_ID}-titles-v1`;
  const snap = await getDoc(doc(db, "storage", titlesKey));

  if (!snap.exists()) {
    console.error("No chapter titles found for story:", STORY_ID);
    process.exit(1);
  }

  const titles = JSON.parse(snap.data().value);
  console.log("Current chapter titles:", JSON.stringify(titles, null, 2));

  let changed = false;
  for (const [key, value] of Object.entries(titles)) {
    // Skip lang-specific keys like "1_en", "1_es"
    if (key.includes("_")) continue;

    // Check if the title itself is a bad translation / AI refusal
    if (isBadTranslation(value, value) || value.length > 150) {
      console.log(`\nChapter ${key}: BAD title detected, skipping (needs manual regeneration)`);
      console.log(`  "${value.slice(0, 100)}..."`);
      continue;
    }

    // Check _en and _es variants
    for (const lang of ["en", "es"]) {
      const langKey = `${key}_${lang}`;
      const langValue = titles[langKey];

      if (!langValue) {
        console.log(`\nChapter ${key}: missing ${langKey}, translating from "${value}"...`);
        const tr = await translateText(value, lang);
        if (!isBadTranslation(tr, value)) {
          titles[langKey] = tr;
          changed = true;
          console.log(`  -> "${tr}"`);
        } else {
          console.log(`  -> BAD translation, skipping: "${tr.slice(0, 100)}"`);
        }
      } else if (isBadTranslation(langValue, value)) {
        console.log(`\nChapter ${key}: BAD ${langKey} detected, re-translating...`);
        console.log(`  Old: "${langValue.slice(0, 100)}"`);
        const tr = await translateText(value, lang);
        if (!isBadTranslation(tr, value)) {
          titles[langKey] = tr;
          changed = true;
          console.log(`  -> "${tr}"`);
        } else {
          console.log(`  -> Still bad, skipping: "${tr.slice(0, 100)}"`);
        }
      } else {
        console.log(`Chapter ${key} ${langKey}: OK ("${langValue}")`);
      }
    }
  }

  if (changed) {
    await setDoc(doc(db, "storage", titlesKey), { value: JSON.stringify(titles) });
    console.log("\nSaved updated titles to Firestore.");
    console.log("Final titles:", JSON.stringify(titles, null, 2));
  } else {
    console.log("\nAll chapter titles look good.");
  }

  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
