import { callClaude } from "./api.js";

export async function generateIllustration(passageText, storyContext, artStylePrompt, storyEntries = []) {
  // Build character consistency context from all previous passages
  const previousPassages = storyEntries
    .map((e, i) => e.text || "")
    .filter(Boolean);

  const characterContext = previousPassages.length > 1
    ? `\n\nPREVIOUS PASSAGES (use these to maintain IDENTICAL character appearances):\n${previousPassages.slice(0, -1).map((p, i) => `Page ${i + 1}: ${p.slice(0, 200)}`).join("\n")}`
    : "";

  const isFirstPage = previousPassages.length <= 1;

  const styleDirective = artStylePrompt
    ? `\n\nMANDATORY ART STYLE (follow EXACTLY, do not deviate):\n${artStylePrompt}`
    : `\nUse a soft watercolor children's book illustration style.`;

  const systemPrompt = `You are an art director ensuring PERFECT VISUAL CONSISTENCY across a children's picture book. Your job is to write an image generation prompt.

CRITICAL RULES:
1. STYLE CONSISTENCY: The art style description below is LAW. Copy its exact color hex codes, rendering rules, and character design template into your prompt verbatim. Do NOT paraphrase or simplify the style — include ALL specific details.
2. CHARACTER CONSISTENCY: ${isFirstPage
    ? "This is the FIRST illustration. Establish each character's appearance in precise detail — exact hair color (use hex code), eye color (use hex code), skin tone (use hex code), clothing colors (use hex codes), and any distinguishing features. These descriptions will be reused for ALL future pages."
    : "You MUST describe every returning character with the EXACT SAME appearance as established. Same hair color, eye color, skin tone, clothing, proportions. Do NOT vary any character detail. Describe each character explicitly even if they appeared before."}
3. FORMAT: Square format, 1:1 aspect ratio. Single scene, no text or words in the image.
4. CONTENT: Child-friendly, safe, age-appropriate only.
5. OUTPUT: Write ONLY the image prompt (under 120 words). No commentary, no preamble.${styleDirective}${characterContext}`;

  const imagePrompt = await callClaude(
    systemPrompt,
    `Story context: ${storyContext}\n\nCurrent passage to illustrate: ${passageText}`,
    200
  );

  // Call Gemini image generation via serverless proxy
  const resp = await fetch("/api/gemini/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: [
        {
          parts: [{ text: imagePrompt }],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    }),
  });

  if (!resp.ok) {
    const errBody = await resp.text().catch(() => "unknown");
    throw new Error(`Gemini API ${resp.status}: ${errBody.slice(0, 200)}`);
  }

  const data = await resp.json();

  // Extract the image from the response
  const parts = data.candidates?.[0]?.content?.parts || [];
  const imagePart = parts.find((p) => p.inlineData);
  if (!imagePart) {
    throw new Error("No image returned from Gemini");
  }

  // Convert base64 to blob
  const base64 = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || "image/png";
  const byteChars = atob(base64);
  const byteArray = new Uint8Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteArray[i] = byteChars.charCodeAt(i);
  }
  return new Blob([byteArray], { type: mimeType });
}
