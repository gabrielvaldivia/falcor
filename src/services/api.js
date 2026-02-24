export async function callClaude(system, userMessage, maxTokens = 100) {
  const resp = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "unknown");
    throw new Error(`API ${resp.status}: ${errBody.slice(0, 200)}`);
  }
  const data = await resp.json();
  return (data.content || [])
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

export const translationCache = new Map();

export async function translateText(text, targetLang) {
  if (!text) return text;
  const cacheKey = `${targetLang}:${text}`;
  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);
  try {
    const translated = await callClaude(
      `Translate the following text to ${targetLang === "es" ? "Spanish" : "English"}. Output ONLY the translated text, nothing else. Preserve paragraph breaks, formatting, and tone.`,
      text,
      Math.max(200, text.length * 2)
    );
    if (translated && translated.length > 0) {
      translationCache.set(cacheKey, translated);
      return translated;
    }
  } catch (err) {
    console.warn("Translation failed:", err.message);
  }
  return text;
}
