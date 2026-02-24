export const STORIES_INDEX_KEY = "stories-index-v1";

export async function loadStoriesIndex() {
  try {
    const result = await window.storage.get(STORIES_INDEX_KEY, true);
    return result ? JSON.parse(result.value) : [];
  } catch {
    return [];
  }
}

export async function saveStoriesIndex(index) {
  await window.storage.set(STORIES_INDEX_KEY, JSON.stringify(index), true);
}

export function storyKey(id, suffix) {
  return `story-${id}-${suffix}`;
}

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function findStoryBySlug(index, slug) {
  return index.find((s) => s.slug === slug);
}

export async function deleteStoryData(id) {
  const suffixes = ["data-v1", "prompt-v1", "prompt-en-v1", "prompt-es-v1", "count-v1", "chapter-v1", "titles-v1"];
  for (const s of suffixes) {
    await window.storage.delete(storyKey(id, s), true).catch(() => {});
  }
}
