import React, { useState, useEffect, useCallback, useRef } from "react";
import HTMLFlipBook from "react-pageflip";
import { GoArrowLeft, GoArrowRight, GoLocation } from "react-icons/go";
import { BsSliders2Vertical } from "react-icons/bs";
import { splitIntoParagraphs, splitIntoStanzas } from "../utils/text.js";
import TypewriterReveal from "./TypewriterReveal.jsx";

const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Faustina', serif";

/* ── Individual page wrapper (forwardRef required by react-pageflip) ── */
const Page = React.forwardRef(({ children, style }, ref) => (
  <div ref={ref} style={{ ...style, boxSizing: "border-box" }}>
    {children}
  </div>
));

/* ── Text content renderer ── */
function TextContent({ text, writingStyle, isChapterStart }) {
  const isRhyming = writingStyle === "rhyming";
  const style = {
    fontFamily: SERIF, fontSize: "19px", fontWeight: 300,
    lineHeight: isRhyming ? 1.4 : 1.8, color: "#e8ddd0", margin: 0,
    textRendering: "optimizeLegibility", fontOpticalSizing: "auto",
    fontFeatureSettings: '"kern", "liga", "calt"',
    hangingPunctuation: "first last",
    textWrap: "pretty", hyphens: "manual",
    overflowWrap: "break-word",
    display: "flex", flexDirection: "column", gap: isRhyming ? "24px" : "12px",
  };

  if (isRhyming) {
    return (
      <div style={style}>
        {splitIntoStanzas(text).map((stanza, si) => (
          <div key={si} style={{ margin: 0 }}>
            {stanza.map((line, li) => (
              <div key={li}>{line.charAt(0).toUpperCase() + line.slice(1)}</div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={style}>
      {splitIntoParagraphs(text).map((para, i) => (
        <p key={i} className={isChapterStart && i === 0 ? "drop-cap" : undefined} style={{ margin: 0 }}>
          {para.charAt(0).toUpperCase() + para.slice(1)}
        </p>
      ))}
    </div>
  );
}

/* ── Page style helpers ── */
const pageBase = {
  background: "#1a1815",
  border: "1px solid rgba(255,255,255,0.06)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
};

export default function BookView({
  story, phase, generatedText, narrowViewport, activeStoryMeta, activeStoryFont,
  chapterTitles, translatedChapterTitles, translatedTexts, lang, t,
  currentPrompt, answer, setAnswer, error, setError, promptLoading,
  showSliders, setShowSliders, sliderPlot, setSliderPlot,
  sliderDialogue, setSliderDialogue, sliderSurprise, setSliderSurprise,
  sliderEmotion, setSliderEmotion, geoEnabled, setGeoEnabled,
  geoLabel, setGeoLabel, requestBrowserLocation,
  handleSubmit, handleQuickAdd, handleRewrite, handleConfirm,
  handleStreamingComplete, generationSource, setPhase, setGeneratedText,
  loadingImages,
  title, storyCount, updatedAt, dateLocale,
}) {
  const bookRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [bookReady, setBookReady] = useState(false);
  const [prevStoryLen, setPrevStoryLen] = useState(story.length);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  // Measure container width for responsive sizing
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setContainerWidth(w);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute page dimensions — each page is square, book shows two side by side
  const pageWidth = narrowViewport
    ? Math.min(containerWidth, 500)
    : Math.floor(Math.min(containerWidth / 2, 550));
  const pageHeight = pageWidth; // square pages

  const hasVirtualSpread = phase === "streaming" || phase === "adding" || phase === "reveal" || phase === "generating";

  // Build pages array
  // react-pageflip uses individual pages (not spreads). With showCover,
  // page 0 = front cover (shown alone), then pairs of 2, last = back cover alone.
  const pages = [];

  // Page 0: Title/cover page (shown alone as the front cover)
  if (title) {
    pages.push({ type: "title" });
  }

  // Story pages: pairs of [text, illustration] for each entry
  story.forEach((entry, i) => {
    const isChapterStart = i === 0 || entry.chapter !== story[i - 1]?.chapter;
    const entryText = entry[`text_${lang}`] || translatedTexts[i] || entry.text;
    pages.push({ type: "text", entryIndex: i, text: entryText, isChapterStart });
    pages.push({ type: "illustration", entryIndex: i, imageUrl: entry.imageUrl, imageLoading: !!loadingImages[i] });
  });

  // Virtual pages for streaming/generating/reveal
  if (hasVirtualSpread) {
    pages.push({ type: "virtual-text" });
    pages.push({ type: "virtual-illustration" });
  }

  // "To be continued..." as the last left page, blank right as back cover
  // The prompt will be overlaid on the right side outside the flipbook
  pages.push({ type: "continued" });

  // Ensure the back cover is a standalone page (need odd total for showCover)
  // showCover: page 0 alone, pairs in middle, last page alone
  // So we need an odd total page count
  if (pages.length % 2 === 0) {
    pages.push({ type: "blank" });
  }

  const totalPages = pages.length;

  // Auto-advance when new story entry arrives
  useEffect(() => {
    if (story.length > prevStoryLen && prevStoryLen > 0 && bookRef.current) {
      // Find the page index for the latest story text
      const targetPage = (title ? 1 : 0) + (story.length - 1) * 2;
      setTimeout(() => {
        bookRef.current.pageFlip()?.flip(targetPage);
      }, 100);
    }
    setPrevStoryLen(story.length);
  }, [story.length, prevStoryLen, title]);

  // Auto-advance to virtual spread when generating
  useEffect(() => {
    if (hasVirtualSpread && bookRef.current) {
      const virtualTextIndex = (title ? 1 : 0) + story.length * 2;
      setTimeout(() => {
        bookRef.current.pageFlip()?.flip(virtualTextIndex);
      }, 100);
    }
  }, [hasVirtualSpread, story.length, title]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return;
      if (!bookRef.current) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); bookRef.current.pageFlip().flipPrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); bookRef.current.pageFlip().flipNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const onFlip = useCallback((e) => {
    setCurrentPage(e.data);
  }, []);

  const goPrev = () => bookRef.current?.pageFlip()?.flipPrev();
  const goNext = () => bookRef.current?.pageFlip()?.flipNext();

  const canPrev = currentPage > 0;
  const canNext = currentPage < totalPages - 1;
  // The "continued" page is the left page of the last spread (second-to-last page)
  const continuedPageIndex = pages.findIndex((p) => p.type === "continued");
  const showPrompt = currentPage >= continuedPageIndex;

  /* ── Render prompt section ── */
  const renderPromptContent = () => {
    if (phase === "reveal" || phase === "adding") {
      return (
        <div style={{ minHeight: "120px", display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ marginBottom: "8px" }}>
            <button onClick={() => { setPhase("input"); setGeneratedText(""); }} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: "13px", color: "#999", cursor: "pointer", padding: 0 }}>
              <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{t("back_btn")}
            </button>
          </div>
          <div style={{ marginBottom: "24px", flex: 1 }}>
            <TypewriterReveal text={generatedText} narrow={true} writingStyle={activeStoryMeta?.writingStyle} />
          </div>
          {generationSource === "local" && <p style={{ fontFamily: MONO, fontSize: "11px", color: "rgba(255,255,255,0.45)", marginBottom: "16px" }}>{t("local_fallback")}</p>}
          <div style={{ display: "flex", gap: "20px", justifyContent: "flex-end" }}>
            {phase === "adding" ? <span style={{ fontFamily: MONO, fontSize: "13px", color: "#999" }}>{t("adding")}</span> : (
              <>
                <button onClick={handleRewrite} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: "13px", color: "#999", cursor: "pointer", padding: 0 }}>{t("rewrite")}</button>
                <button onClick={handleConfirm} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: "13px", color: "#e8ddd0", cursor: "pointer", padding: 0 }}>{t("add")}</button>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: "15px", color: "rgba(255,255,255,0.5)", lineHeight: 1.7, margin: 0, ...(promptLoading ? { animation: "pulse 1.5s ease-in-out infinite" } : {}) }}>{currentPrompt}</p>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px 0" }}>
          <textarea value={answer} onChange={(e) => { setAnswer(e.target.value); setError(null); }} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }} placeholder={t("write_answer")} disabled={phase === "generating"} style={{ width: "100%", flex: 1, background: "transparent", border: "none", padding: 0, fontFamily: "'Courier New', Courier, monospace", fontSize: "15px", lineHeight: 1.7, color: phase === "generating" ? "rgba(255,255,255,0.3)" : "#e8ddd0", resize: "none", outline: "none" }} />
          {error && <p style={{ marginTop: "8px", fontFamily: MONO, fontSize: "12px", color: "#c97a7a" }}>{error}</p>}
          {showSliders && phase === "input" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", padding: "12px 0 0" }}>
              {[
                { label: t("slider_plot"), value: sliderPlot, set: setSliderPlot, labels: t("plot_labels") },
                { label: t("slider_dialogue"), value: sliderDialogue, set: setSliderDialogue, labels: t("dialogue_labels") },
                { label: t("slider_surprise"), value: sliderSurprise, set: setSliderSurprise, labels: t("surprise_labels") },
                { label: t("slider_emotion"), value: sliderEmotion, set: setSliderEmotion, labels: t("emotion_labels") },
              ].map(({ label, value, set, labels }) => (
                <div key={label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                    <span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(255,255,255,0.45)" }}>{labels[value]}</span>
                  </div>
                  <input type="range" min={0} max={9} step={1} value={value} onChange={(e) => set(Number(e.target.value))} className="passage-slider" style={{ width: "100%", cursor: "pointer" }} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {phase !== "generating" && <button onClick={() => setShowSliders((v) => !v)} style={{ background: "none", border: "none", color: showSliders ? "#e8ddd0" : "rgba(255,255,255,0.25)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title={t("slider_tooltip")}><BsSliders2Vertical size={14} /></button>}
            {phase !== "generating" && (
              <button onClick={async () => { if (geoEnabled) { localStorage.removeItem("falcor_geo_enabled"); setGeoEnabled(false); setGeoLabel(""); } else { const loc = await requestBrowserLocation(); if (loc) { localStorage.setItem("falcor_geo_enabled", "true"); setGeoEnabled(true); setGeoLabel(loc); } else { setGeoEnabled(false); setGeoLabel(""); } } }} style={{ background: "none", border: "none", color: geoEnabled ? "#ffffff" : "rgba(255,255,255,0.25)", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }} title={geoEnabled ? t("geo_on") : t("geo_off")}>
                <GoLocation size={14} />{geoEnabled && geoLabel && <span style={{ fontFamily: MONO, fontSize: "10px", marginLeft: "5px", color: "rgba(255,255,255,0.5)" }}>{geoLabel}</span>}
              </button>
            )}
          </div>
          {phase === "generating" ? <span style={{ fontFamily: MONO, fontSize: "13px", color: "#999" }}>{t("writing")}</span> : (
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              <button onClick={handleSubmit} disabled={!answer.trim()} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: "13px", color: answer.trim() ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)", cursor: answer.trim() ? "pointer" : "default", padding: 0 }}>{t("preview")}</button>
              <button onClick={handleQuickAdd} disabled={!answer.trim()} style={{ background: answer.trim() ? "#e8ddd0" : "rgba(255,255,255,0.08)", border: "none", borderRadius: "20px", fontFamily: MONO, fontSize: "12px", color: answer.trim() ? "#0f0e0c" : "rgba(255,255,255,0.2)", cursor: answer.trim() ? "pointer" : "default", padding: "6px 16px", transition: "all 0.15s" }}>{t("add")}</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Render a page by its descriptor ── */
  const renderPageContent = (page) => {
    switch (page.type) {
      case "title":
        return (
          <div style={{ ...pageBase, justifyContent: "center", alignItems: "center", padding: "32px" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
              <h1 style={{ fontFamily: activeStoryFont.family, fontSize: narrowViewport ? "32px" : "42px", fontWeight: activeStoryFont.weight || 700, color: "#e8ddd0", lineHeight: 1.2, margin: 0, textWrap: "balance" }}>{title}</h1>
              <p style={{ fontFamily: SERIF, fontSize: "13px", fontStyle: "italic", color: "rgba(255,255,255,0.35)", marginTop: "16px" }}>
                {storyCount === 0 ? t("loading") : (<>{storyCount} {storyCount !== 1 ? t("contributions") : t("contribution")}{updatedAt && (<> · {new Date(updatedAt).toLocaleDateString(dateLocale, { month: "short", day: "numeric", year: "numeric" })}</>)}</>)}
              </p>
            </div>
          </div>
        );

      case "text":
        return (
          <div style={{ ...pageBase, padding: "24px", overflowY: "auto", justifyContent: "center" }}>
            <TextContent text={page.text} writingStyle={activeStoryMeta?.writingStyle} isChapterStart={page.isChapterStart} />
          </div>
        );

      case "illustration": {
        const { imageUrl, imageLoading } = page;
        return (
          <div style={{ ...pageBase, justifyContent: "center", alignItems: "center" }}>
            {imageLoading && !imageUrl && <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />}
            {imageUrl && <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
            {!imageUrl && !imageLoading && (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: "14px", color: "rgba(255,255,255,0.12)" }}>&#x25A1;</span>
                </div>
              </div>
            )}
          </div>
        );
      }

      case "virtual-text":
        return (
          <div style={{ ...pageBase, padding: "24px", overflowY: "auto", justifyContent: "center" }}>
            {phase === "generating" && <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}><span style={{ fontFamily: MONO, fontSize: "13px", color: "#999" }}>{t("writing")}</span></div>}
            {phase === "streaming" && generatedText && <TypewriterReveal text={generatedText} narrow={true} writingStyle={activeStoryMeta?.writingStyle} onComplete={handleStreamingComplete} />}
            {phase === "adding" && generatedText && <div style={{ fontFamily: SERIF, fontSize: "17px", fontWeight: 300, lineHeight: 1.8, color: "#e8ddd0", opacity: 0.5, display: "flex", flexDirection: "column", gap: "12px" }}>{splitIntoParagraphs(generatedText).map((para, i) => (<p key={i} style={{ margin: 0 }}>{para}</p>))}</div>}
            {phase === "reveal" && generatedText && renderPromptContent()}
          </div>
        );

      case "virtual-illustration":
        return (
          <div style={{ ...pageBase, justifyContent: "center", alignItems: "center" }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s ease-in-out infinite" }} />
          </div>
        );

      case "continued":
        return (
          <div style={{ ...pageBase, justifyContent: "center", alignItems: "center", padding: "32px" }}>
            <p style={{
              fontFamily: activeStoryFont.family,
              fontSize: narrowViewport ? "24px" : "32px",
              fontWeight: activeStoryFont.weight || 700,
              fontStyle: "italic",
              color: "rgba(232,221,208,0.6)",
              textAlign: "center",
              lineHeight: 1.4,
              margin: 0,
            }}>
              To be continued…
            </p>
          </div>
        );

      case "blank":
        return <div style={pageBase} />;

      default:
        return <div style={pageBase} />;
    }
  };

  // Don't render the flip book until we have a valid size
  if (!pageWidth || pageWidth < 50) {
    return <div ref={containerRef} style={{ width: "100%" }} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
      <div ref={containerRef} style={{ width: "100%" }}>
        {/* Fixed-width container matching a full spread, with the flipbook and prompt overlay */}
        <div style={{
          position: "relative",
          width: narrowViewport ? `${pageWidth}px` : `${pageWidth * 2}px`,
          height: `${pageHeight}px`,
          margin: "0 auto",
        }}>
          <HTMLFlipBook
            ref={bookRef}
            width={pageWidth}
            height={pageHeight}
            size="fixed"
            showCover={true}
            drawShadow={true}
            maxShadowOpacity={0.3}
            flippingTime={600}
            useMouseEvents={true}
            mobileScrollSupport={true}
            clickEventForward={true}
            swipeDistance={30}
            onFlip={onFlip}
            onInit={() => setBookReady(true)}
            style={{}}
          >
            {pages.map((page, i) => (
              <Page key={i}>
                {renderPageContent(page)}
              </Page>
            ))}
          </HTMLFlipBook>

          {/* Prompt panel — overlays the right half of the last spread */}
          {showPrompt && !narrowViewport && (
            <div style={{
              ...pageBase,
              position: "absolute",
              top: 0,
              right: 0,
              width: `${pageWidth}px`,
              height: `${pageHeight}px`,
              padding: "24px",
              overflowY: "auto",
              boxSizing: "border-box",
              zIndex: 10,
            }}>
              {renderPromptContent()}
            </div>
          )}
        </div>

        {/* Mobile: prompt below the book */}
        {showPrompt && narrowViewport && (
          <div style={{
            ...pageBase,
            width: `${pageWidth}px`,
            padding: "24px",
            marginTop: "16px",
            borderRadius: "8px",
            boxSizing: "border-box",
            margin: "16px auto 0",
            minHeight: "200px",
          }}>
            {renderPromptContent()}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", padding: "8px 0" }}>
        <button onClick={goPrev} disabled={!canPrev} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: "12px", color: canPrev ? "#e8ddd0" : "rgba(255,255,255,0.15)", cursor: canPrev ? "pointer" : "default", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
          <GoArrowLeft size={14} /> {t("page_prev")}
        </button>
        <span style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.4)", minWidth: "60px", textAlign: "center" }}>
          {currentPage + 1} / {totalPages}
        </span>
        <button onClick={goNext} disabled={!canNext} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: "12px", color: canNext ? "#e8ddd0" : "rgba(255,255,255,0.15)", cursor: canNext ? "pointer" : "default", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
          {t("page_next")} <GoArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
