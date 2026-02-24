import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

function getDb() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return getFirestore(app);
}

export default async function handler(req, res) {
  const { slug } = req.query;
  const db = getDb();

  let storyTitle = null;
  let description = "Collaborative storytelling with AI";

  try {
    const snap = await getDoc(doc(db, "storage", "stories-index-v1"));
    if (snap.exists()) {
      const stories = JSON.parse(snap.data().value);
      const story = stories.find(
        (s) => s.slug === slug || String(s.id) === slug
      );
      if (story) {
        storyTitle = story.title || null;
        const genre = story.genre || "";
        const genreLabel = genre.charAt(0).toUpperCase() + genre.slice(1);
        description = genreLabel
          ? `A ${genreLabel.toLowerCase()} story on Falkor`
          : "A collaborative story on Falkor";
        if (story.passageCount) {
          description += ` · ${story.passageCount} contributions`;
        }
      }
    }
  } catch (e) {
    console.error("Failed to read story index:", e);
  }

  const ogTitle = storyTitle ? `Falkor - ${storyTitle}` : "Falkor";
  const pageTitle = storyTitle ? `${storyTitle} — Falkor` : "Falkor — Collaborative Storytelling with AI";
  const origin = `${req.headers["x-forwarded-proto"] || "https"}://${req.headers.host}`;
  const appUrl = `${origin}/#story/${slug}`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:image" content="${origin}/og.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  <meta name="twitter:image" content="${origin}/og.png" />
  <meta http-equiv="refresh" content="0;url=${appUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${appUrl}">${escapeHtml(storyTitle || "Falkor")}</a>...</p>
</body>
</html>`);
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
