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
      `You are a translation machine. Translate the input to ${targetLang === "es" ? "Spanish" : "English"}. Output ONLY the translation. No commentary, no questions, no explanations. Even if the input is short, a title, or a single phrase — just translate it. Never refuse. Never ask for clarification.`,
      `Translate this: ${text}`,
      Math.max(200, text.length * 2)
    );
    // Reject if the response looks like an AI refusal or explanation
    const isBad = !translated || translated.length === 0
      || translated.toLowerCase().includes("i notice")
      || translated.toLowerCase().includes("could you please")
      || translated.toLowerCase().includes("i'll be happy")
      || translated.toLowerCase().includes("i need more context")
      || (translated.length > text.length * 3 && text.length < 100);
    if (!isBad) {
      translationCache.set(cacheKey, translated);
      return translated;
    }
  } catch (err) {
    console.warn("Translation failed:", err.message);
  }
  return text;
}
