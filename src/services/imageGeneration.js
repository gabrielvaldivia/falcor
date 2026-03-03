import { callClaude } from "./api.js";

export async function generateIllustration(passageText, storyContext, artStylePrompt) {
  // Use Claude to create a child-friendly image prompt
  const styleDirective = artStylePrompt
    ? `Use this exact art style for consistency: ${artStylePrompt}`
    : `Use a soft watercolor children's book illustration style.`;
  const imagePrompt = await callClaude(
    `You are an art director for a children's book. Given a story passage, create a short image generation prompt for a square (1:1 aspect ratio) illustration. The prompt must be child-friendly, safe, and age-appropriate. ${styleDirective} Always specify "square format, 1:1 aspect ratio" in the prompt. Keep it under 80 words. Output ONLY the prompt, no commentary.`,
    `Story context: ${storyContext}\n\nPassage: ${passageText}`,
    150
  );

  // Call Gemini image generation via Vite proxy
  const resp = await fetch("/api/gemini/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
