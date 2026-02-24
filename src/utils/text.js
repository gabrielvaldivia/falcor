export function splitIntoParagraphs(text) {
  if (!text) return [text];
  if (text.includes("\n\n")) {
    return text.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
  }
  const sentences = text.match(/[^.!?]+[.!?]+[\s"]*/g);
  if (!sentences || sentences.length <= 3) return [text];
  const paragraphs = [];
  let current = "";
  let count = 0;
  const target = Math.ceil(sentences.length / Math.ceil(sentences.length / 3));
  for (const s of sentences) {
    current += s;
    count++;
    if (count >= target) {
      paragraphs.push(current.trim());
      current = "";
      count = 0;
    }
  }
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs.length > 0 ? paragraphs : [text];
}
