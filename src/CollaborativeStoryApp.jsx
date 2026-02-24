import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { GoArrowLeft, GoKebabHorizontal, GoLocation, GoChevronDown } from "react-icons/go";
import { BsSliders2Vertical } from "react-icons/bs";

import { TRANSLATIONS } from "./constants/translations.js";
import { MONO, TYPEWRITER, SERIF, storyFontForId, buildFontIndexMap, bookColor } from "./constants/fonts.js";
import { getStoryContext, getStyleForStory } from "./utils/storyContext.js";
import { translateText } from "./services/api.js";
import { storyKey, slugify, findStoryBySlug, loadStoriesIndex, saveStoriesIndex, deleteStoryData } from "./services/storage.js";
import { requestBrowserLocation, fetchLocation } from "./services/location.js";
import { generatePrompt, shouldEndChapter, generateChapterTitle, generateStoryOpener, generateStoryPassage, retitleStory } from "./services/storyGeneration.js";

import TypewriterReveal from "./components/TypewriterReveal.jsx";
import StoryLine from "./components/StoryLine.jsx";
import StoryPopover from "./components/StoryPopover.jsx";
import HomeScreen from "./components/HomeScreen.jsx";
import AboutScreen from "./components/AboutScreen.jsx";
import NewStoryScreen from "./components/NewStoryScreen.jsx";
import AppFooter from "./components/AppFooter.jsx";

export default function CollaborativeStoryApp() {
  // Navigation state
  const HASH_TO_LAYOUT = { "#rows": "rows", "#slideshow": "carousel", "#activity": "activity" };
  const LAYOUT_TO_HASH = { rows: "#rows", carousel: "#slideshow", activity: "#activity" };
  const [view, setView] = useState(() => {
    if (window.location.hash === "#about") return "about";
    if (window.location.hash.match(/^#story\//) || window.location.pathname.match(/^\/api\/story\//)) return "story";
    return "home";
  }); // "home" | "new" | "story" | "about"
  const [homeLayout, setHomeLayout] = useState(() => {
    return HASH_TO_LAYOUT[window.location.hash] || "rows";
  }); // "rows" | "carousel" | "activity"
  const [lang, setLang] = useState(() => {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang === "en" || urlLang === "es") return urlLang;
    return localStorage.getItem("falcor_lang") || "en";
  });
  const t = useCallback((key) => TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.en[key] ?? key, [lang]);
  useEffect(() => {
    localStorage.setItem("falcor_lang", lang);
    // Keep ?lang= query param in sync
    const url = new URL(window.location);
    if (lang !== "en") {
      url.searchParams.set("lang", lang);
    } else {
      url.searchParams.delete("lang");
    }
    if (url.toString() !== window.location.href) {
      history.replaceState(history.state, "", url.toString());
    }
  }, [lang]);
  // Helper: append ?lang= to any relative URL path when lang !== "en"
  const withLang = useCallback((path) => {
    if (lang === "en") return path;
    // If path has a hash, insert ?lang= before the hash
    const hashIdx = path.indexOf("#");
    if (hashIdx !== -1) {
      const before = path.slice(0, hashIdx);
      const hash = path.slice(hashIdx);
      const sep = before.includes("?") ? "&" : "?";
      return before + sep + "lang=" + lang + hash;
    }
    const sep = path.includes("?") ? "&" : "?";
    return path + sep + "lang=" + lang;
  }, [lang]);
  const dateLocale = lang === "es" ? "es-ES" : "en-US";
  const updateHomeLayout = useCallback((layout) => {
    setHomeLayout(layout);
    history.replaceState(null, "", withLang("/" + (LAYOUT_TO_HASH[layout] || "#rows")));
  }, [withLang]);

  const [activeStoryId, setActiveStoryId] = useState(null);
  const [storiesIndex, setStoriesIndex] = useState([]);

  // Story state
  const [story, setStory] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState("input");
  const [generatedText, setGeneratedText] = useState("");
  const [generationSource, setGenerationSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [contributorCount, setContributorCount] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterTitles, setChapterTitles] = useState({});
  const [error, setError] = useState(null);
  const [hoveredEntry, setHoveredEntry] = useState(null);
  const [translatedTitle, setTranslatedTitle] = useState(null);
  const [translatedTexts, setTranslatedTexts] = useState({});
  const [translatedChapterTitles, setTranslatedChapterTitles] = useState({});

  const [narrowViewport, setNarrowViewport] = useState(false);
  const [visibleChapter, setVisibleChapter] = useState(1);
  const [dialogEntry, setDialogEntry] = useState(null);
  const [pinnedEntry, setPinnedEntry] = useState(null);
  const [showStoryMenu, setShowStoryMenu] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const [topBarScrolled, setTopBarScrolled] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmDeleteMenu, setConfirmDeleteMenu] = useState(false);
  const [showSliders, setShowSliders] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  const prevPlotRef = useRef(5);
  const [sliderPlot, setSliderPlot] = useState(5);
  const [sliderDialogue, setSliderDialogue] = useState(2);
  const [sliderSurprise, setSliderSurprise] = useState(3);
  const [sliderEmotion, setSliderEmotion] = useState(4);
  const [geoEnabled, setGeoEnabled] = useState(() => localStorage.getItem("falcor_geo_enabled") === "true");
  const [geoLabel, setGeoLabel] = useState("");
  const storyEndRef = useRef(null);
  const contentRef = useRef(null);
  const pollRef = useRef(null);

  // Active story metadata
  const fontIndexMap = useMemo(() => buildFontIndexMap(storiesIndex), [storiesIndex]);
  const activeStoryMeta = storiesIndex.find((s) => s.id === activeStoryId);
  const activeStoryFont = activeStoryMeta ? storyFontForId(activeStoryMeta.genre, activeStoryMeta.id, fontIndexMap) : { family: SERIF, weight: 600 };
  const activeStoryColor = activeStoryMeta ? bookColor(activeStoryMeta.genre, activeStoryMeta.id) : null;

  const getGenreVoiceCtx = useCallback(() => {
    if (!activeStoryMeta) return "";
    return getStoryContext(activeStoryMeta);
  }, [activeStoryMeta]);

  const getActiveStyleSettings = useCallback(() => {
    const base = activeStoryMeta
      ? getStyleForStory(activeStoryMeta.genre, activeStoryMeta.writingStyle)
      : { tone: 5, length: 4, mood: 5, dialogue: 2 };
    return { ...base, plot: sliderPlot, dialogue: sliderDialogue, surprise: sliderSurprise, emotion: sliderEmotion };
  }, [activeStoryMeta, sliderPlot, sliderDialogue, sliderSurprise, sliderEmotion]);

  // Translate story content when language changes (legacy fallback for old stories without stored translations)
  useEffect(() => {
    if (lang === "en") {
      setTranslatedTitle(null);
      setTranslatedTexts({});
      setTranslatedChapterTitles({});
      return;
    }
    let cancelled = false;
    // Only runtime-translate title if no stored translation exists
    if (activeStoryMeta?.title && !activeStoryMeta[`title_${lang}`]) {
      translateText(activeStoryMeta.title, lang).then((tr) => {
        if (!cancelled) setTranslatedTitle(tr);
      });
    }
    // Only runtime-translate passages that lack stored translations
    if (story.length > 0) {
      story.forEach((entry, i) => {
        if (!entry[`text_${lang}`]) {
          translateText(entry.text, lang).then((tr) => {
            if (!cancelled) setTranslatedTexts((prev) => ({ ...prev, [i]: tr }));
          });
        }
      });
    }
    // Only runtime-translate chapter titles that lack stored translations
    if (chapterTitles && Object.keys(chapterTitles).length > 0) {
      Object.entries(chapterTitles).forEach(([ch, title]) => {
        if (!ch.includes("_") && !chapterTitles[`${ch}_${lang}`]) {
          translateText(title, lang).then((tr) => {
            if (!cancelled) setTranslatedChapterTitles((prev) => ({ ...prev, [ch]: tr }));
          });
        }
      });
    }
    // Load stored prompt for the switched-to language
    if (activeStoryId) {
      window.storage.get(storyKey(activeStoryId, `prompt-${lang}-v1`), true).then((result) => {
        if (!cancelled && result?.value) setCurrentPrompt(result.value);
      }).catch(() => {});
    }
    return () => { cancelled = true; };
  }, [lang, activeStoryMeta?.title, story, chapterTitles]);

  // Regenerate prompt when plot slider changes (debounced)
  useEffect(() => {
    if (prevPlotRef.current === sliderPlot) return;
    prevPlotRef.current = sliderPlot;
    if (!showSliders || phase !== "input" || story.length === 0) return;
    const timer = setTimeout(async () => {
      setPromptLoading(true);
      try {
        const ctx = getGenreVoiceCtx();
        const newPrompt = await generatePrompt(story, currentChapter, false, ctx, sliderPlot, lang);
        setCurrentPrompt(newPrompt);
      } catch (err) {
        console.warn("Plot slider prompt regeneration failed:", err.message);
      } finally {
        setPromptLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [sliderPlot]);

  // Resolve geo label on mount if enabled
  useEffect(() => {
    if (geoEnabled) {
      requestBrowserLocation().then((loc) => { if (loc) setGeoLabel(loc); });
    }
  }, []);

  // Load stories index on mount + check hash for deep link
  useEffect(() => {
    (async () => {
      const idx = await loadStoriesIndex();
      setStoriesIndex(idx);
      setLoading(false);

      const hash = window.location.hash;
      const slugMatch = hash.match(/^#story\/(.+)$/) || window.location.pathname.match(/^\/api\/story\/(.+)$/);
      if (slugMatch) {
        const slug = slugMatch[1];
        // Support legacy numeric IDs
        const numId = parseInt(slug, 10);
        const found = !isNaN(numId) && idx.some((s) => s.id === numId)
          ? idx.find((s) => s.id === numId)
          : findStoryBySlug(idx, slug);
        if (found) {
          openStory(found.id);
        }
      } else if (!hash || hash === "#") {
        history.replaceState(null, "", withLang("/#rows"));
      }
    })();
  }, []);

  // One-time migration: retitle all existing stories with better titles
  useEffect(() => {
    const RETITLE_KEY = "falcor_retitled_v3";
    if (localStorage.getItem(RETITLE_KEY)) return;
    if (storiesIndex.length === 0) return;

    (async () => {
      let updated = [...storiesIndex];
      let changed = false;

      for (const meta of storiesIndex) {
        if (!meta.title) continue;
        try {
          const storyResult = await window.storage.get(storyKey(meta.id, "data-v1"), true);
          const storyData = storyResult ? JSON.parse(storyResult.value) : [];
          if (storyData.length === 0) continue;

          // Generate English title from English text
          const enTitle = await retitleStory(storyData, meta.genre, meta.writingStyle, "en");
          if (!enTitle) continue;

          // Generate Spanish title from the same English title (translation, not regeneration)
          const esTitle = await translateText(enTitle, "es");

          const newSlug = slugify(enTitle) || meta.slug;
          updated = updated.map((s) =>
            s.id === meta.id
              ? { ...s, title: enTitle, title_en: enTitle, ...(esTitle ? { title_es: esTitle } : {}), slug: newSlug }
              : s
          );
          changed = true;
        } catch (err) {
          console.warn(`Retitle failed for story ${meta.id}:`, err.message);
        }
      }

      if (changed) {
        await saveStoriesIndex(updated);
        setStoriesIndex(updated);
      }
      localStorage.setItem(RETITLE_KEY, "done");
    })();
  }, [storiesIndex.length]);

  // Load a specific story's data
  const loadStoryData = useCallback(async (id, isInitial) => {
    try {
      const storyResult = await window.storage.get(storyKey(id, "data-v1"), true);
      const countResult = await window.storage.get(storyKey(id, "count-v1"), true);
      const chapterResult = await window.storage.get(storyKey(id, "chapter-v1"), true);
      const titlesResult = await window.storage.get(storyKey(id, "titles-v1"), true);
      const loadedStory = storyResult ? JSON.parse(storyResult.value) : [];
      const loadedChapter = chapterResult ? parseInt(chapterResult.value, 10) : 1;
      const loadedTitles = titlesResult ? JSON.parse(titlesResult.value) : {};
      if (storyResult) setStory(loadedStory);
      if (countResult) setContributorCount(parseInt(countResult.value, 10));
      setCurrentChapter(loadedChapter);
      setChapterTitles(loadedTitles);

      if (isInitial) {
        // Load the active story meta for genre/voice context
        const idx = await loadStoriesIndex();
        const meta = idx.find((s) => s.id === id);
        const ctx = meta ? getStoryContext(meta) : "";

        // Backfill titles for completed chapters that don't have one
        const allChapters = [...new Set(loadedStory.map((e) => e.chapter || 1))];
        const completedWithoutTitle = allChapters.filter(
          (ch) => ch < loadedChapter && !loadedTitles[ch]
        );
        if (completedWithoutTitle.length > 0) {
          const backfilled = { ...loadedTitles };
          await Promise.all(completedWithoutTitle.map(async (ch) => {
            const title = await generateChapterTitle(loadedStory, ch, lang);
            if (title) { backfilled[ch] = title; backfilled[`${ch}_${lang}`] = title; }
          }));
          setChapterTitles(backfilled);
          await window.storage.set(storyKey(id, "titles-v1"), JSON.stringify(backfilled), true);

          // Fire-and-forget: translate backfilled chapter titles to other language
          const otherLangBf = lang === "en" ? "es" : "en";
          Promise.all(completedWithoutTitle.map(async (ch) => {
            if (!backfilled[ch]) return;
            const tr = await translateText(backfilled[ch], otherLangBf);
            if (tr) return { ch, tr };
          })).then(async (results) => {
            const patched = { ...backfilled };
            let changed = false;
            for (const r of results) {
              if (r) { patched[`${r.ch}_${otherLangBf}`] = r.tr; patched[`${r.ch}_${lang}`] = backfilled[r.ch]; changed = true; }
            }
            if (changed) {
              await window.storage.set(storyKey(id, "titles-v1"), JSON.stringify(patched), true).catch(() => {});
              setChapterTitles(patched);
            }
          }).catch(() => {});
        }

        // Try to load stored prompt for current language first
        const storedPrompt = await window.storage.get(storyKey(id, `prompt-${lang}-v1`), true).catch(() => null);
        const isBadPrompt = storedPrompt?.value && (storedPrompt.value.length > 150 || !storedPrompt.value.includes("?") || storedPrompt.value.toLowerCase().includes("i need more context"));
        if (storedPrompt?.value && !isBadPrompt) {
          setCurrentPrompt(storedPrompt.value);
        } else {
          const prompt = await generatePrompt(loadedStory, loadedChapter, false, ctx, sliderPlot, lang);
          setCurrentPrompt(prompt);
          await window.storage.set(storyKey(id, "prompt-v1"), prompt, true);
          await window.storage.set(storyKey(id, `prompt-${lang}-v1`), prompt, true);

          // Fire-and-forget: translate prompt to other language
          const otherLangP = lang === "en" ? "es" : "en";
          translateText(prompt, otherLangP).then(async (tr) => {
            if (tr) await window.storage.set(storyKey(id, `prompt-${otherLangP}-v1`), tr, true).catch(() => {});
          }).catch(() => {});
        }
      }
    } catch (e) { /* first run */ }
  }, []);

  // Navigate to a story
  const openStory = useCallback(async (id) => {
    setActiveStoryId(id);
    setStory([]);
    prevStoryLenRef.current = 0;
    setCurrentPrompt("");
    setAnswer("");
    setPhase("input");
    setGeneratedText("");
    setGenerationSource("");
    setContributorCount(0);
    setCurrentChapter(1);
    setChapterTitles({});
    setError(null);
    setShowStoryMenu(false);
    setLinkCopied(false);
    setConfirmDeleteMenu(false);
    setShowSliders(false);
    const meta = storiesIndex.find((s) => s.id === id);
    const defaults = meta
      ? getStyleForStory(meta.genre, meta.writingStyle)
      : { length: 4, dialogue: 2, surprise: 3, emotion: 4 };
    setSliderPlot(5);
    setSliderDialogue(defaults.dialogue);
    setSliderSurprise(defaults.surprise ?? 3);
    setSliderEmotion(defaults.emotion ?? 4);
    // Clear any existing polling before starting new story
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setView("story");
    const storySlug = meta?.slug || id;
    history.pushState({ story: storySlug }, "", withLang("/api/story/" + storySlug));

    await loadStoryData(id, true);

    // Only start polling if we're still on this story
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadStoryData(id, false), 5000);
  }, [loadStoryData, storiesIndex]);

  // Handle browser back/forward
  useEffect(() => {
    const onPopState = async () => {
      const hash = window.location.hash;
      const path = window.location.pathname;
      if (hash === "#about") { setView("about"); return; }
      const slugMatch = hash.match(/^#story\/(.+)$/) || path.match(/^\/api\/story\/(.+)$/);
      if (slugMatch) {
        const slug = slugMatch[1];
        const numId = parseInt(slug, 10);
        // Use storiesIndex if available, otherwise load fresh
        const idx = storiesIndex.length > 0 ? storiesIndex : await loadStoriesIndex();
        const found = !isNaN(numId) && idx.some((s) => s.id === numId)
          ? idx.find((s) => s.id === numId)
          : findStoryBySlug(idx, slug);
        if (found) { openStory(found.id); return; }
      }
      if (pollRef.current) clearInterval(pollRef.current);
      window.scrollTo(0, 0);
      setView("home");
      setActiveStoryId(null);
      setShowStoryMenu(false);
      const layoutFromHash = HASH_TO_LAYOUT[hash];
      if (layoutFromHash) setHomeLayout(layoutFromHash);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [openStory, storiesIndex]);

  // Clean up polling when leaving story view
  useEffect(() => {
    if (view !== "story" && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [view]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Track which chapter is currently visible on scroll
  useEffect(() => {
    if (view !== "story") return;
    const onScroll = () => {
      const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
      let current = 0;
      for (const ch of chapters) {
        const el = document.getElementById(`chapter-${ch}`);
        if (el && el.getBoundingClientRect().top <= 80) current = ch;
      }
      setVisibleChapter(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [view, story]);

  // Check if popover fits to the right of content
  useEffect(() => {
    const check = () => {
      if (contentRef.current) {
        const right = contentRef.current.getBoundingClientRect().right;
        setNarrowViewport(right + 304 > window.innerWidth);
      } else {
        setNarrowViewport(window.innerWidth < 960);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [view]);

  useEffect(() => {
    if (view !== "story") { setTopBarScrolled(false); return; }
    const onScroll = () => setTopBarScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [view]);

  const prevStoryLenRef = useRef(0);
  useEffect(() => {
    if (view === "story" && story.length > prevStoryLenRef.current && prevStoryLenRef.current > 0 && storyEndRef.current) {
      storyEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
    prevStoryLenRef.current = story.length;
  }, [story, view]);

  const handleSubmit = async () => {
    if (!answer.trim() || phase !== "input") return;
    setPhase("generating");
    setError(null);

    const userAnswer = answer.trim();

    try {
      const result = await generateStoryPassage(
        story, currentPrompt, userAnswer,
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx(), lang
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      console.error("All generation failed:", e);
      setError(t("error_generation"));
      setPhase("input");
    }
  };

  const quickAddAnswerRef = useRef(null);

  const handleQuickAdd = async () => {
    if (!answer.trim() || phase !== "input") return;
    setPhase("generating");
    setError(null);
    const userAnswer = answer.trim();
    quickAddAnswerRef.current = userAnswer;
    try {
      const result = await generateStoryPassage(
        story, currentPrompt, userAnswer,
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx()
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("streaming");
      // Scroll to bottom after a tick so the streaming entry is rendered
      setTimeout(() => storyEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      console.error("All generation failed:", e);
      setError(t("error_generation"));
      setPhase("input");
    }
  };

  const handleStreamingComplete = useCallback(async () => {
    if (phase !== "streaming") return;
    setPhase("adding");
    await handleConfirmWith(generatedText, quickAddAnswerRef.current || answer.trim());
  }, [phase, generatedText, answer]);

  const handleConfirm = async () => {
    setPhase("adding");
    await handleConfirmWith(generatedText, answer.trim());
  };

  const handleConfirmWith = async (text, originalAnswer) => {
    const newCount = contributorCount + 1;
    const now = new Date();
    const timeStr = now.toLocaleString(dateLocale, {
      month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
    const location = await fetchLocation();

    const newEntry = {
      text: text,
      [`text_${lang}`]: text,
      originalAnswer: originalAnswer,
      prompt: currentPrompt,
      [`prompt_${lang}`]: currentPrompt,
      author: newCount,
      location: location,
      time: timeStr,
      ts: Date.now(),
      chapter: currentChapter,
    };

    try {
      // Re-read fresh from storage to avoid overwriting concurrent contributions
      const freshResult = await window.storage.get(storyKey(activeStoryId, "data-v1"), true);
      const freshStory = freshResult ? JSON.parse(freshResult.value) : story;
      const updatedStory = [...freshStory, newEntry];
      let nextChapter = currentChapter;
      let isNewChapter = false;
      let updatedTitles = chapterTitles;
      const chapterEnded = await shouldEndChapter(updatedStory, currentChapter);
      if (chapterEnded) {
        nextChapter = currentChapter + 1;
        isNewChapter = true;
        const title = await generateChapterTitle(updatedStory, currentChapter, lang);
        if (title) {
          updatedTitles = { ...chapterTitles, [currentChapter]: title, [`${currentChapter}_${lang}`]: title };
          await window.storage.set(storyKey(activeStoryId, "titles-v1"), JSON.stringify(updatedTitles), true);
        }
      }

      const nextPrompt = await generatePrompt(updatedStory, nextChapter, isNewChapter, getGenreVoiceCtx(), sliderPlot, lang);
      await window.storage.set(storyKey(activeStoryId, "data-v1"), JSON.stringify(updatedStory), true);
      await window.storage.set(storyKey(activeStoryId, "prompt-v1"), nextPrompt, true);
      await window.storage.set(storyKey(activeStoryId, `prompt-${lang}-v1`), nextPrompt, true);
      await window.storage.set(storyKey(activeStoryId, "count-v1"), String(newCount), true);
      await window.storage.set(storyKey(activeStoryId, "chapter-v1"), String(nextChapter), true);

      // Update stories index metadata
      const existingMeta = storiesIndex.find((s) => s.id === activeStoryId);
      const derivedTitle = existingMeta?.title || updatedTitles[1] || (updatedStory[0] ? updatedStory[0].text.split(/[.!?]/)[0].slice(0, 50) : "");
      const updatedIndex = storiesIndex.map((s) =>
        s.id === activeStoryId
          ? { ...s, title: derivedTitle, passageCount: updatedStory.length, updatedAt: new Date().toISOString() }
          : s
      );
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);

      // Fire-and-forget: translate new passage, prompt, and chapter title to other language
      const otherLang = lang === "en" ? "es" : "en";
      const toTranslate = [
        translateText(text, otherLang),
        translateText(nextPrompt, otherLang),
        chapterEnded && updatedTitles[currentChapter] ? translateText(updatedTitles[currentChapter], otherLang) : Promise.resolve(null),
      ];
      Promise.all(toTranslate).then(async ([trText, trPrompt, trChTitle]) => {
        // Patch the new entry with bilingual text
        if (trText) {
          const lastIdx = updatedStory.length - 1;
          const patchedStory = updatedStory.map((e, i) =>
            i === lastIdx ? { ...e, [`text_${otherLang}`]: trText, [`text_${lang}`]: e.text } : e
          );
          await window.storage.set(storyKey(activeStoryId, "data-v1"), JSON.stringify(patchedStory), true).catch(() => {});
          setStory(patchedStory);
        }
        // Save translated prompt
        if (trPrompt) {
          await window.storage.set(storyKey(activeStoryId, `prompt-${otherLang}-v1`), trPrompt, true).catch(() => {});
        }
        // Save translated chapter title
        if (trChTitle) {
          const patchedTitles = { ...updatedTitles, [`${currentChapter}_${otherLang}`]: trChTitle, [`${currentChapter}_${lang}`]: updatedTitles[currentChapter] };
          await window.storage.set(storyKey(activeStoryId, "titles-v1"), JSON.stringify(patchedTitles), true).catch(() => {});
          setChapterTitles(patchedTitles);
        }
      }).catch(() => {});

      setStory(updatedStory);
      setCurrentPrompt(nextPrompt);
      setContributorCount(newCount);
      setCurrentChapter(nextChapter);
      setChapterTitles(updatedTitles);
      setAnswer("");
      setGeneratedText("");
      setGenerationSource("");
      // Reset sliders to story defaults
      const defaults = activeStoryMeta
        ? getStyleForStory(activeStoryMeta.genre, activeStoryMeta.writingStyle)
        : { length: 4, dialogue: 2, surprise: 3, emotion: 4 };
      setSliderPlot(5);
      setSliderDialogue(defaults.dialogue);
      setSliderSurprise(defaults.surprise ?? 3);
      setSliderEmotion(defaults.emotion ?? 4);
      setShowSliders(false);
      setPhase("input");
    } catch (e) {
      console.error("Storage error:", e);
      setError(t("error_save"));
      setPhase("reveal");
    }
  };

  const handleRewrite = async () => {
    setPhase("generating");
    setError(null);
    try {
      const result = await generateStoryPassage(
        story, currentPrompt, answer.trim(),
        getActiveStyleSettings(), currentChapter, getGenreVoiceCtx(), lang
      );
      setGeneratedText(result.text);
      setGenerationSource(result.source);
      setPhase("reveal");
    } catch (e) {
      setError(t("error_rewrite"));
      setPhase("reveal");
    }
  };

  const handleReset = async () => {
    if (!activeStoryId) return;
    await deleteStoryData(activeStoryId);

    // Remove from index
    const updatedIndex = storiesIndex.filter((s) => s.id !== activeStoryId);
    await saveStoriesIndex(updatedIndex);
    setStoriesIndex(updatedIndex);

    // Go home
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    setView("home");
    setActiveStoryId(null);
  };

  const handleDeleteStory = async (id) => {
    await deleteStoryData(id);

    const updatedIndex = storiesIndex.filter((s) => s.id !== id);
    await saveStoriesIndex(updatedIndex);
    setStoriesIndex(updatedIndex);
  };

  const handleCreateStory = async (meta) => {
    // Generate opener BEFORE saving to index — prevents zombie entries on failure
    const opener = await generateStoryOpener(meta, lang);

    // Reset local state
    setActiveStoryId(meta.id);
    setStory([]);
    setCurrentPrompt("");
    setAnswer("");
    setGeneratedText("");
    setGenerationSource("");
    setContributorCount(0);
    setCurrentChapter(1);
    setChapterTitles({});
    setError(null);

    if (opener) {
      const now = new Date();
      const timeStr = now.toLocaleString(dateLocale, {
        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      });
      const location = await fetchLocation();
      const firstEntry = {
        text: opener.paragraph,
        [`text_${lang}`]: opener.paragraph,
        originalAnswer: "",
        prompt: "",
        author: 1,
        location,
        time: timeStr,
        ts: Date.now(),
        chapter: 1,
      };
      const newStory = [firstEntry];
      const slug = slugify(opener.title) || String(meta.id);
      const savedMeta = { ...meta, title: opener.title, [`title_${lang}`]: opener.title, slug, passageCount: 1, updatedAt: new Date().toISOString() };

      // Save everything at once — index + story data
      const updatedIndex = [...storiesIndex, savedMeta];
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);
      await window.storage.set(storyKey(meta.id, "data-v1"), JSON.stringify(newStory), true);
      await window.storage.set(storyKey(meta.id, "count-v1"), "1", true);
      await window.storage.set(storyKey(meta.id, "chapter-v1"), "1", true);

      setStory(newStory);
      setContributorCount(1);

      // Generate the first prompt for user input
      const ctx = getStoryContext(meta);
      const prompt = await generatePrompt(newStory, 1, false, ctx, 5, lang);
      setCurrentPrompt(prompt);
      await window.storage.set(storyKey(meta.id, "prompt-v1"), prompt, true);
      await window.storage.set(storyKey(meta.id, `prompt-${lang}-v1`), prompt, true);

      // Fire-and-forget: translate opener title, paragraph, and prompt to other language
      const otherLang = lang === "en" ? "es" : "en";
      Promise.all([
        translateText(opener.title, otherLang),
        translateText(opener.paragraph, otherLang),
        translateText(prompt, otherLang),
      ]).then(async ([trTitle, trParagraph, trPrompt]) => {
        // Patch story entry with bilingual fields
        if (trParagraph) {
          const patched = [{ ...firstEntry, [`text_${otherLang}`]: trParagraph, [`text_${lang}`]: firstEntry.text }];
          await window.storage.set(storyKey(meta.id, "data-v1"), JSON.stringify(patched), true).catch(() => {});
          setStory(patched);
        }
        // Patch index with bilingual title
        if (trTitle) {
          const patchedIndex = storiesIndex.concat(savedMeta).map((s) =>
            s.id === meta.id ? { ...s, [`title_${otherLang}`]: trTitle, [`title_${lang}`]: opener.title } : s
          );
          await saveStoriesIndex(patchedIndex).catch(() => {});
          setStoriesIndex(patchedIndex);
        }
        // Save translated prompt
        if (trPrompt) {
          await window.storage.set(storyKey(meta.id, `prompt-${otherLang}-v1`), trPrompt, true).catch(() => {});
        }
      }).catch(() => {});

      history.replaceState(null, "", withLang("#story/" + slug));
    } else {
      // Opener failed — still save to index so user isn't stuck, but with no story data
      const updatedIndex = [...storiesIndex, meta];
      await saveStoriesIndex(updatedIndex);
      setStoriesIndex(updatedIndex);

      const ctx = getStoryContext(meta);
      const prompt = await generatePrompt([], 1, false, ctx, 5, lang);
      setCurrentPrompt(prompt);
      await window.storage.set(storyKey(meta.id, "prompt-v1"), prompt, true);
      await window.storage.set(storyKey(meta.id, `prompt-${lang}-v1`), prompt, true);

      // Fire-and-forget: translate prompt to other language
      const otherLang2 = lang === "en" ? "es" : "en";
      translateText(prompt, otherLang2).then(async (trPrompt) => {
        if (trPrompt) await window.storage.set(storyKey(meta.id, `prompt-${otherLang2}-v1`), trPrompt, true).catch(() => {});
      }).catch(() => {});

      history.replaceState(null, "", withLang("#story/" + meta.id));
    }

    // Everything is ready — navigate directly to the story
    setPhase("input");
    setView("story");

    // Start polling
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadStoryData(meta.id, false), 5000);
  };

  const goHome = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    window.scrollTo(0, 0);
    setView("home");
    setActiveStoryId(null);
    setShowStoryMenu(false);
    history.pushState(null, "", withLang("/" + (LAYOUT_TO_HASH[homeLayout] || "#rows")));
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Faustina:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0f0e0c; overflow-x: hidden; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        textarea:focus { outline: none; }
        textarea::placeholder { color: rgba(255,255,255,0.25); }
        .story-scroll::-webkit-scrollbar { width: 4px; }
        .story-scroll::-webkit-scrollbar-track { background: transparent; }
        .story-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
        .passage-slider { -webkit-appearance: none; appearance: none; height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; outline: none; }
        .passage-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 10px; height: 10px; border-radius: 50%; background: #e8ddd0; cursor: pointer; }
        .passage-slider::-moz-range-track { height: 2px; background: rgba(255,255,255,0.1); border-radius: 1px; border: none; }
        .passage-slider::-moz-range-thumb { width: 10px; height: 10px; border-radius: 50%; background: #e8ddd0; cursor: pointer; border: none; }
        .drop-cap::first-letter { float: left; font-size: 3.7em; line-height: 0.75; padding-right: 6px; padding-top: 4px; font-weight: 400; }
        .story-hscroll::-webkit-scrollbar { display: none; }
        @media (max-width: 600px) {
          .about-ascii { font-size: 7px !important; }
        }
      `}</style>

      {/* Mobile: fixed top bar with back, chapter title, menu */}
      {view === "story" && narrowViewport && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: topBarScrolled ? "rgba(14,13,11,0.85)" : "transparent",
          backdropFilter: topBarScrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: topBarScrolled ? "blur(12px)" : "none",
          borderBottom: topBarScrolled ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
          transition: "background 0.3s, border-color 0.3s, backdrop-filter 0.3s",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
          height: "48px",
        }}>
                <button
                  onClick={goHome}
                  style={{
                    background: "none", border: "none",
                    fontFamily: MONO, fontSize: "12px",
                    color: "rgba(255,255,255,0.5)", cursor: "pointer",
                    padding: "8px 0",
                  }}
                >
                  <GoArrowLeft size={16} />
                </button>
                <div style={{ flex: 1, padding: "0 12px", position: "relative" }}>
                  {(() => {
                    const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
                    const hasMultiple = chapters.length > 1;
                    return (
                      <>
                        <button
                          onClick={() => hasMultiple && setShowChapterDropdown(!showChapterDropdown)}
                          style={{
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "11px",
                            color: "rgba(255,255,255,0.5)",
                            letterSpacing: "0.3px",
                            textAlign: "center",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            width: "100%",
                            cursor: hasMultiple ? "pointer" : "default",
                            padding: 0,
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                          }}
                        >
                          <span>
                            {visibleChapter === 0
                              ? (hasMultiple ? t("select_chapter") : "")
                              : chapterTitles[visibleChapter]
                              ? `${t("ch")} ${visibleChapter} — ${chapterTitles[`${visibleChapter}_${lang}`] || translatedChapterTitles[visibleChapter] || chapterTitles[visibleChapter]}`
                              : `${t("chapter")} ${visibleChapter}`}
                          </span>
                          {hasMultiple && <GoChevronDown size={12} />}
                        </button>
                        {showChapterDropdown && (
                          <>
                            <div
                              onClick={() => setShowChapterDropdown(false)}
                              style={{ position: "fixed", inset: 0, zIndex: -1 }}
                            />
                            <div style={{
                              position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
                              marginTop: "8px",
                              background: "#1a1917",
                              border: "1px solid rgba(255,255,255,0.1)",
                              borderRadius: "6px",
                              padding: "4px 0",
                              minWidth: "200px",
                              maxHeight: "60vh",
                              overflowY: "auto",
                              zIndex: 20,
                            }}>
                              {chapters.map((ch) => {
                                const isActive = ch === visibleChapter;
                                return (
                                  <button
                                    key={ch}
                                    onClick={() => {
                                      setShowChapterDropdown(false);
                                      document.getElementById(`chapter-${ch}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
                                    }}
                                    style={{
                                      display: "block", width: "100%",
                                      background: isActive ? "rgba(255,255,255,0.06)" : "none",
                                      border: "none", padding: "10px 16px",
                                      fontFamily: MONO, fontSize: "12px",
                                      color: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)",
                                      cursor: "pointer", textAlign: "left",
                                      letterSpacing: "0.3px",
                                    }}
                                  >
                                    <span style={{ marginRight: "8px" }}>{ch}.</span>
                                    {ch === currentChapter ? t("in_progress") : (chapterTitles[`${ch}_${lang}`] || translatedChapterTitles[ch] || chapterTitles[ch] || `${t("chapter")} ${ch}`)}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => { setShowStoryMenu(!showStoryMenu); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.5)", cursor: "pointer",
                      padding: "8px 0",
                      display: "flex", alignItems: "center",
                    }}
                  >
                    <GoKebabHorizontal size={16} />
                  </button>
                  {showStoryMenu && (
                    <>
                      <div
                        onClick={() => { setShowStoryMenu(false); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                        style={{ position: "fixed", inset: 0, zIndex: -1 }}
                      />
                      <div style={{
                        position: "absolute", top: "100%", right: 0,
                        marginTop: "4px",
                        background: "#1a1917",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        padding: "4px 0",
                        minWidth: "160px",
                      }}>
                        <button
                          onClick={() => {
                            const activeMeta = storiesIndex.find((s) => s.id === activeStoryId);
                            const url = window.location.origin + "/api/story/" + (activeMeta?.slug || activeStoryId);
                            navigator.clipboard.writeText(url);
                            setLinkCopied(true);
                            setTimeout(() => { setLinkCopied(false); setShowStoryMenu(false); }, 2000);
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: linkCopied ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                        >
                          {linkCopied ? t("copied") : t("copy_link")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDeleteMenu) {
                              setShowStoryMenu(false);
                              setConfirmDeleteMenu(false);
                              handleReset();
                            } else {
                              setConfirmDeleteMenu(true);
                            }
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: confirmDeleteMenu ? "#c97a7a" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                        >
                          {confirmDeleteMenu ? t("confirm_delete") : t("delete_btn")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

      <div style={{
        minHeight: "100vh",
        background: "#0f0e0c",
        position: "relative",
      }}>
        {/* ── Home View ── */}
        {view === "home" && (
          <HomeScreen
            stories={storiesIndex}
            onSelectStory={openStory}
            onNewStory={() => { window.scrollTo(0, 0); setView("new"); }}
            onAbout={() => { window.scrollTo(0, 0); history.pushState(null, "", withLang("/#about")); setView("about"); }}
            homeLayout={homeLayout}
            setHomeLayout={updateHomeLayout}
            fontIndexMap={fontIndexMap}
            lang={lang}
            setLang={setLang}
            t={t}
          />
        )}

        {/* ── New Story View ── */}
        {view === "new" && (
          <NewStoryScreen
            onCancel={() => { history.pushState(null, "", withLang("/" + (LAYOUT_TO_HASH[homeLayout] || "#rows"))); setView("home"); }}
            onCreate={handleCreateStory}
            narrow={narrowViewport}
            t={t}
            lang={lang}
            setLang={setLang}
            onAbout={() => { window.scrollTo(0, 0); history.pushState(null, "", withLang("/#about")); setView("about"); }}
          />
        )}

        {/* ── About View ── */}
        {view === "about" && (
          <AboutScreen onBack={() => { history.pushState(null, "", withLang("/" + (LAYOUT_TO_HASH[homeLayout] || "#rows"))); setView("home"); }} narrow={narrowViewport} t={t} lang={lang} setLang={setLang} />
        )}

        {/* ── Story View ── */}
        {view === "story" && (
          <>
            {/* Desktop: fixed left sidebar with back button + chapter nav */}
            {!narrowViewport && (
              <>
                <div style={{
                  position: "fixed", left: "24px", top: "24px",
                  zIndex: 5,
                  display: "flex", flexDirection: "column", gap: "20px",
                }}>
                  <button
                    onClick={goHome}
                    style={{
                      background: "none", border: "none",
                      fontFamily: MONO, fontSize: "12px",
                      color: visibleChapter === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      padding: 0, textAlign: "left",
                      display: "flex", alignItems: "center", gap: "8px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = visibleChapter === 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.3)"}
                  >
                    <GoArrowLeft size={14} style={{ flexShrink: 0, width: "16px" }} />
                    <span>{activeStoryMeta?.[`title_${lang}`] || translatedTitle || activeStoryMeta?.title || t("home")}</span>
                  </button>
                  {(() => {
                    const chapters = [...new Set(story.map((e) => e.chapter || 1))].sort((a, b) => a - b);
                    if (chapters.length <= 1) return null;
                    return (
                      <nav style={{
                        fontFamily: MONO, fontSize: "12px",
                        display: "flex", flexDirection: "column", gap: "8px",
                      }}>
                        {chapters.map((ch) => {
                          const isActive = ch === visibleChapter;
                          return (
                            <button
                              key={ch}
                              onClick={() => document.getElementById(`chapter-${ch}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
                              style={{
                                background: "none", border: "none", padding: 0,
                                fontFamily: MONO, fontSize: "12px",
                                color: isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)",
                                cursor: "pointer", textAlign: "left",
                                letterSpacing: "0.5px",
                                display: "flex", alignItems: "baseline", gap: "8px",
                                transition: "color 0.2s",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                              onMouseLeave={(e) => e.currentTarget.style.color = isActive ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.25)"}
                            >
                              <span style={{ width: "16px", textAlign: "center", flexShrink: 0 }}>{ch}</span>
                              <span>{ch === currentChapter ? t("in_progress") : (chapterTitles[`${ch}_${lang}`] || translatedChapterTitles[ch] || chapterTitles[ch] || "")}</span>
                            </button>
                          );
                        })}
                      </nav>
                    );
                  })()}
                </div>

                {/* Desktop: fixed top-right three-dot menu */}
                <div style={{ position: "fixed", top: "24px", right: "24px", zIndex: 5 }}>
                  <button
                    onClick={() => { setShowStoryMenu(!showStoryMenu); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.5)", cursor: "pointer",
                      padding: "4px 8px",
                      display: "flex", alignItems: "center",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                  >
                    <GoKebabHorizontal size={16} />
                  </button>
                  {showStoryMenu && (
                    <>
                      <div
                        onClick={() => { setShowStoryMenu(false); setConfirmDeleteMenu(false); setLinkCopied(false); }}
                        style={{ position: "fixed", inset: 0, zIndex: -1 }}
                      />
                      <div style={{
                        position: "absolute", top: "100%", right: 0,
                        marginTop: "4px",
                        background: "#1a1917",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "6px",
                        padding: "4px 0",
                        minWidth: "160px",
                      }}>
                        <button
                          onClick={() => {
                            const activeMeta = storiesIndex.find((s) => s.id === activeStoryId);
                            const url = window.location.origin + "/api/story/" + (activeMeta?.slug || activeStoryId);
                            navigator.clipboard.writeText(url);
                            setLinkCopied(true);
                            setTimeout(() => { setLinkCopied(false); setShowStoryMenu(false); }, 2000);
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: linkCopied ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          {linkCopied ? t("copied") : t("copy_link")}
                        </button>
                        <button
                          onClick={() => {
                            if (confirmDeleteMenu) {
                              setShowStoryMenu(false);
                              setConfirmDeleteMenu(false);
                              handleReset();
                            } else {
                              setConfirmDeleteMenu(true);
                            }
                          }}
                          style={{
                            display: "block", width: "100%",
                            background: "none", border: "none",
                            fontFamily: MONO, fontSize: "12px",
                            color: confirmDeleteMenu ? "#c97a7a" : "rgba(255,255,255,0.5)",
                            cursor: "pointer", padding: "8px 14px",
                            textAlign: "left",
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "none"}
                        >
                          {confirmDeleteMenu ? t("confirm_delete") : t("delete_btn")}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {activeStoryColor && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: "80vh",
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${activeStoryColor.bg} 0%, transparent 100%)`,
                pointerEvents: "none", zIndex: 0,
              }} />
            )}
            <div ref={contentRef} style={{ maxWidth: "600px", margin: "0 auto", padding: narrowViewport ? "48px 24px 40px" : "60px 24px 40px", overflow: "visible", position: "relative", zIndex: 1 }}>

              {/* ── Spacer ── */}
              <div style={{ marginBottom: narrowViewport ? "24px" : "48px" }} />

              {/* ── Story Title ── */}
              {activeStoryMeta?.title && (
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  ...(narrowViewport ? {
                    height: "90vh",
                    marginTop: "-48px",
                  } : {
                    minHeight: "80vh",
                  }),
                }}>
                  <h1 style={{
                    fontFamily: activeStoryFont.family, fontSize: narrowViewport ? "42px" : "64px", fontWeight: activeStoryFont.weight || 700,
                    color: "#e8ddd0", lineHeight: 1.2,
                    padding: "40px 0",
                    marginBottom: 0,
                    textAlign: "center",
                    textWrap: "balance",
                  }}>
                    {activeStoryMeta[`title_${lang}`] || translatedTitle || activeStoryMeta.title}
                  </h1>
                  <p style={{
                    fontFamily: SERIF, fontSize: "15px", fontStyle: "italic",
                    color: "rgba(255,255,255,0.45)",
                    textAlign: "center", marginTop: narrowViewport ? "0px" : "12px",
                  }}>
                    {story.length === 0 ? t("loading") : (
                      <>
                        {story.length} {story.length !== 1 ? t("contributions") : t("contribution")}
                        {activeStoryMeta.updatedAt && (
                          <> · {t("last_updated")}: {new Date(activeStoryMeta.updatedAt).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}</>
                        )}
                      </>
                    )}
                  </p>
                </div>
              )}


              {/* ── Story ── */}
              {story.length > 0 && (
                <div style={{ marginBottom: "48px", position: "relative" }}>
                  <div
                    className="story-scroll"
                    style={{
                      display: "flex", flexDirection: "column", gap: "24px",
                    }}
                  >
                    {story.map((entry, i) => {
                      const showChapterHeading = i === 0 || entry.chapter !== story[i - 1].chapter;
                      const showPopover = pinnedEntry && (pinnedEntry.ts === entry.ts) && !narrowViewport;
                      return (
                        <div key={entry.ts || i}>
                          {showChapterHeading && (
                            <div id={`chapter-${entry.chapter || 1}`} style={{
                              textAlign: "center",
                              marginTop: i === 0 ? 0 : "72px",
                              marginBottom: chapterTitles[entry.chapter || 1] ? "72px" : "16px",
                              scrollMarginTop: "64px",
                            }}>
                              <div style={{
                                fontFamily: MONO, fontSize: "12px",
                                color: "rgba(255,255,255,0.45)",
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                              }}>
                                {t("chapter")} {entry.chapter || 1}
                              </div>
                              {chapterTitles[entry.chapter || 1] && (
                                <div style={{
                                  fontFamily: activeStoryFont.family, fontSize: "28px",
                                  color: "#e8ddd0",
                                  fontWeight: activeStoryFont.weight || 700,
                                  marginTop: "8px",
                                }}>
                                  {chapterTitles[`${entry.chapter || 1}_${lang}`] || translatedChapterTitles[entry.chapter || 1] || chapterTitles[entry.chapter || 1]}
                                </div>
                              )}
                            </div>
                          )}
                          <div style={{
                            position: "relative",
                            opacity: pinnedEntry && pinnedEntry.ts !== entry.ts ? 0.5 : 1,
                            transition: "opacity 0.2s",
                          }}>
                            <StoryLine
                              entry={entry}
                              translatedText={translatedTexts[i]}
                              lang={lang}
                              narrow={narrowViewport}
                              isChapterStart={showChapterHeading}
                              onHover={(e) => {
                                if (pinnedEntry) setPinnedEntry(e);
                                setHoveredEntry(e);
                              }}
                              onLeave={() => {
                                if (!pinnedEntry) setHoveredEntry(null);
                              }}
                              onShowDialog={setDialogEntry}
                              onPinPopover={(e) => setPinnedEntry(e)}
                              hideIcon={!!pinnedEntry && !narrowViewport}
                            />
                            {showPopover && (
                              <div style={{
                                position: "absolute",
                                left: "100%",
                                top: 0,
                                paddingLeft: "24px",
                                width: "304px",
                              }}>
                                <div style={{
                                  position: "sticky",
                                  top: "24px",
                                }}>
                                  <StoryPopover entry={pinnedEntry} onClose={() => setPinnedEntry(null)} t={t} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {phase === "streaming" && generatedText && (
                      <div style={{ position: "relative" }}>
                        <TypewriterReveal
                          text={generatedText}
                          narrow={narrowViewport}
                          onComplete={handleStreamingComplete}
                        />
                      </div>
                    )}
                    <div ref={storyEndRef} />
                  </div>
                </div>
              )}

              {/* ── Prompt + Interaction Container ── */}
              {phase !== "streaming" && <div style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                padding: "24px",
              }}>
                {(phase === "input" || phase === "generating") && (
                  <div>
                    <p style={{
                      fontFamily: TYPEWRITER, fontSize: "16px",
                      color: "rgba(255,255,255,0.5)", lineHeight: 1.7,
                      marginBottom: "16px",
                      transition: "opacity 0.3s ease",
                      ...(promptLoading ? { animation: "pulse 1.5s ease-in-out infinite" } : {}),
                    }}>
                      {currentPrompt}
                    </p>
                    <textarea
                      value={answer}
                      onChange={(e) => { setAnswer(e.target.value); setError(null); }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
                      }}
                      placeholder={t("write_answer")}
                      rows={3}
                      disabled={phase === "generating"}
                      style={{
                        width: "100%", background: "transparent",
                        border: "none",
                        padding: "0 0 12px", fontFamily: TYPEWRITER,
                        fontSize: "16px", lineHeight: 1.7,
                        color: phase === "generating" ? "rgba(255,255,255,0.3)" : "#e8ddd0",
                        resize: "none", minHeight: "80px",
                      }}
                    />
                    {error && (
                      <p style={{
                        marginTop: "8px", fontFamily: MONO,
                        fontSize: "12px", color: "#c97a7a",
                      }}>{error}</p>
                    )}
                    {showSliders && phase === "input" && (
                      <div style={{
                        display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px",
                        padding: "12px 0 0",
                      }}>
                        {[
                          { label: t("slider_plot"), value: sliderPlot, set: setSliderPlot, labels: t("plot_labels") },
                          { label: t("slider_dialogue"), value: sliderDialogue, set: setSliderDialogue, labels: t("dialogue_labels") },
                          { label: t("slider_surprise"), value: sliderSurprise, set: setSliderSurprise, labels: t("surprise_labels") },
                          { label: t("slider_emotion"), value: sliderEmotion, set: setSliderEmotion, labels: t("emotion_labels") },
                        ].map(({ label, value, set, labels }) => (
                          <div key={label}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                              <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                {label}
                              </span>
                              <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>
                                {labels[value]}
                              </span>
                            </div>
                            <input
                              type="range" min={0} max={9} step={1} value={value}
                              onChange={(e) => set(Number(e.target.value))}
                              className="passage-slider"
                              style={{
                                width: "100%", cursor: "pointer",
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "20px 0 0",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {phase !== "generating" && (
                          <button
                            onClick={() => setShowSliders((v) => !v)}
                            style={{
                              background: "none", border: "none",
                              color: showSliders ? "#e8ddd0" : "rgba(255,255,255,0.25)",
                              cursor: "pointer", padding: 0,
                              display: "flex", alignItems: "center",
                            }}
                            title={t("slider_tooltip")}
                          >
                            <BsSliders2Vertical size={14} />
                          </button>
                        )}
                        {phase !== "generating" && (
                          <button
                            onClick={async () => {
                              if (geoEnabled) {
                                localStorage.removeItem("falcor_geo_enabled");
                                setGeoEnabled(false);
                                setGeoLabel("");
                              } else {
                                const loc = await requestBrowserLocation();
                                if (loc) {
                                  localStorage.setItem("falcor_geo_enabled", "true");
                                  setGeoEnabled(true);
                                  setGeoLabel(loc);
                                } else {
                                  setGeoEnabled(false);
                                  setGeoLabel("");
                                }
                              }
                            }}
                            style={{
                              background: "none", border: "none",
                              color: geoEnabled ? "#ffffff" : "rgba(255,255,255,0.25)",
                              cursor: "pointer", padding: 0,
                              display: "flex", alignItems: "center",
                            }}
                            title={geoEnabled ? t("geo_on") : t("geo_off")}
                          >
                            <GoLocation size={14} />
                            {geoEnabled && geoLabel && (
                              <span style={{ fontFamily: MONO, fontSize: "10px", marginLeft: "5px", color: "rgba(255,255,255,0.5)" }}>
                                {geoLabel}
                              </span>
                            )}
                          </button>
                        )}
                      </div>
                      {phase === "generating" ? (
                        <span style={{
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999",
                        }}>
                          {t("writing")}
                        </span>
                      ) : (
                        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                          <button
                            onClick={handleSubmit}
                            disabled={!answer.trim()}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: answer.trim() ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
                              cursor: answer.trim() ? "pointer" : "default",
                              padding: 0,
                            }}
                          >
                            {t("preview")}
                          </button>
                          <button
                            onClick={handleQuickAdd}
                            disabled={!answer.trim()}
                            style={{
                              background: answer.trim() ? "#e8ddd0" : "rgba(255,255,255,0.08)",
                              border: "none",
                              borderRadius: "20px",
                              fontFamily: MONO, fontSize: "12px",
                              color: answer.trim() ? "#0f0e0c" : "rgba(255,255,255,0.2)",
                              cursor: answer.trim() ? "pointer" : "default",
                              padding: "6px 16px",
                              transition: "all 0.15s",
                            }}
                          >
                            {t("add")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(phase === "reveal" || phase === "adding") && (
                  <div style={{ minHeight: "180px", display: "flex", flexDirection: "column" }}>
                    <div style={{ marginBottom: "8px" }}>
                      <button
                        onClick={() => { setPhase("input"); setGeneratedText(""); }}
                        style={{
                          background: "none", border: "none",
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999", cursor: "pointer", padding: 0,
                        }}
                      >
                        <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{t("back_btn")}
                      </button>
                    </div>
                    <div style={{ marginBottom: "24px", flex: 1 }}>
                      <TypewriterReveal text={generatedText} narrow={narrowViewport} />
                    </div>
                    {generationSource === "local" && (
                      <p style={{
                        fontFamily: MONO, fontSize: "11px",
                        color: "rgba(255,255,255,0.45)", marginBottom: "16px",
                      }}>
                        {t("local_fallback")}
                      </p>
                    )}

                    <div style={{ display: "flex", gap: "20px", justifyContent: "flex-end" }}>
                      {phase === "adding" ? (
                        <span style={{
                          fontFamily: MONO, fontSize: "13px",
                          color: "#999",
                        }}>
                          {t("adding")}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={handleRewrite}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: "#999", cursor: "pointer", padding: 0,
                            }}
                          >
                            {t("rewrite")}
                          </button>
                          <button
                            onClick={handleConfirm}
                            style={{
                              background: "none", border: "none",
                              fontFamily: MONO, fontSize: "13px",
                              color: "#e8ddd0", cursor: "pointer", padding: 0,
                            }}
                          >
                            {t("add")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

              </div>}

            </div>
            {/* ── Popover Dialog (narrow viewport) ── */}
            {dialogEntry && (
              <div
                onClick={() => setDialogEntry(null)}
                style={{
                  position: "fixed", inset: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 100,
                }}
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <StoryPopover entry={dialogEntry} onClose={() => setDialogEntry(null)} t={t} />
                </div>
              </div>
            )}
            <AppFooter t={t} lang={lang} setLang={setLang} onAbout={() => { window.scrollTo(0, 0); history.pushState(null, "", withLang("/#about")); setView("about"); }} style={{ padding: "48px 24px" }} />
          </>
        )}
      </div>
    </>
  );
}
