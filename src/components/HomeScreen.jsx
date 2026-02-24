import { useState, useEffect, useRef, useCallback } from "react";
import { TbLayoutListFilled, TbLayoutList } from "react-icons/tb";
import { MdOutlineViewCarousel } from "react-icons/md";
import { GoPulse } from "react-icons/go";
import { MONO, TYPEWRITER } from "../constants/fonts.js";
import { storyFontForId, bookColor } from "../constants/fonts.js";
import { GENRES } from "../constants/genres.js";
import { translateText } from "../services/api.js";
import { storyKey } from "../services/storage.js";
import BookTitle from "./BookTitle.jsx";
import StoryRow from "./StoryRow.jsx";
import AppFooter from "./AppFooter.jsx";

export default function HomeScreen({ stories, onSelectStory, onNewStory, onAbout, homeLayout, setHomeLayout, fontIndexMap, lang, setLang, t, lastViewedStoryId }) {
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const carouselRef = useRef(null);
  const [carouselFilter, setCarouselFilter] = useState("all");
  const [translatedTitles, setTranslatedTitles] = useState({});

  useEffect(() => {
    if (lang === "en") { setTranslatedTitles({}); return; }
    let cancelled = false;
    stories.forEach((s) => {
      if (s.title && !s[`title_${lang}`]) {
        translateText(s.title, lang).then((tr) => {
          if (!cancelled) setTranslatedTitles((prev) => ({ ...prev, [s.id]: tr }));
        });
      }
    });
    return () => { cancelled = true; };
  }, [lang, stories]);
  const pillsRef = useRef(null);
  const [pillsOverflow, setPillsOverflow] = useState(false);
  const [pillsScrollLeft, setPillsScrollLeft] = useState(false);
  const [pillsScrollRight, setPillsScrollRight] = useState(false);

  useEffect(() => {
    const el = pillsRef.current;
    if (!el) return;
    const check = () => {
      const overflows = el.scrollWidth > el.clientWidth + 1;
      setPillsOverflow(overflows);
      setPillsScrollLeft(el.scrollLeft > 2);
      setPillsScrollRight(overflows && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
    };
    check();
    el.addEventListener("scroll", check);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => { ro.disconnect(); el.removeEventListener("scroll", check); };
  }, [homeLayout, carouselFilter]);
  const [activityFeed, setActivityFeed] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const sorted = [...stories].sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));

  useEffect(() => {
    if (homeLayout !== "activity" || stories.length === 0) return;
    let cancelled = false;
    setActivityLoading(true);
    (async () => {
      const entries = [];
      for (const s of stories) {
        try {
          const result = await window.storage.get(storyKey(s.id, "data-v1"), true);
          if (result) {
            const data = JSON.parse(result.value);
            data.forEach((entry, idx) => {
              if (idx === 0) return;
              entries.push({
                ...entry,
                storyId: s.id,
                storyTitle: s[`title_${lang}`] || translatedTitles[s.id] || s.title || t("untitled"),
                storyGenre: s.genre,
                passageIndex: idx,
              });
            });
          }
        } catch { /* skip */ }
      }
      entries.sort((a, b) => (b.ts || 0) - (a.ts || 0));
      if (!cancelled) {
        setActivityFeed(entries);
        setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [homeLayout, stories]);

  useEffect(() => {
    if (homeLayout !== "carousel" || carouselFilter !== "all") return;
    const el = carouselRef.current;
    if (!el) return;
    const needsLoop = sorted.length > 2;
    if (!needsLoop) return;
    requestAnimationFrame(() => {
      // If returning from a story, center on that story's card
      if (lastViewedStoryId) {
        const targetIdx = sorted.findIndex((s) => s.id === lastViewedStoryId);
        if (targetIdx >= 0) {
          // Cards are tripled for infinite loop; target is in the middle set
          const cardIdx = sorted.length + targetIdx;
          const card = el.children[cardIdx];
          if (card) {
            el.scrollLeft = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2;
            return;
          }
        }
      }
      const firstCard = el.children[sorted.length];
      if (firstCard) {
        el.scrollLeft = firstCard.offsetLeft - (el.clientWidth - firstCard.offsetWidth) / 2;
      } else {
        el.scrollLeft = el.scrollWidth / 3;
      }
    });
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const oneSetWidth = el.scrollWidth / 3;
        if (el.scrollLeft >= oneSetWidth * 2 - 1) {
          el.scrollLeft -= oneSetWidth;
        } else if (el.scrollLeft <= 1) {
          el.scrollLeft += oneSetWidth;
        }
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [homeLayout, carouselFilter, sorted.length]);

  const updateCenterScale = useCallback(() => {
    const el = carouselRef.current;
    if (!el || !isTouch) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    for (const child of el.children) {
      const cardCenter = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - cardCenter);
      const maxDist = el.clientWidth / 2;
      const t = Math.min(dist / maxDist, 1);
      const scale = 1.12 - t * 0.12;
      const opacity = 1 - t * 0.4;
      child.style.transform = `scale(${scale})`;
      child.style.opacity = opacity;
    }
  }, [isTouch]);

  useEffect(() => {
    if (homeLayout !== "carousel" || !isTouch) return;
    const el = carouselRef.current;
    if (!el) return;
    requestAnimationFrame(updateCenterScale);
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateCenterScale();
        ticking = false;
      });
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [homeLayout, isTouch, carouselFilter, updateCenterScale]);

  const genreRows = GENRES
    .map((g) => ({ genre: g, stories: sorted.filter((s) => s.genre === g.id) }))
    .filter((r) => r.stories.length > 0);

  const renderFilterPills = () => {
    const hPad = isTouch ? "20px" : "32px";
    return (
      <div style={{ position: "relative", marginTop: isTouch ? "20px" : "12px", marginLeft: isTouch ? `-${hPad}` : 0, marginRight: isTouch ? `-${hPad}` : 0 }}>
        <div
          ref={pillsRef}
          className="story-hscroll"
          style={{
            display: "flex", gap: "6px",
            overflowX: "auto", scrollbarWidth: "none", msOverflowStyle: "none",
            justifyContent: pillsOverflow ? "flex-start" : "center",
            paddingLeft: isTouch ? hPad : 0, paddingRight: isTouch ? hPad : 0,
          }}
        >
          {[{ id: "all", label: t("all") }, ...GENRES].map((g) => {
            const active = carouselFilter === g.id;
            return (
              <button
                key={g.id}
                onClick={() => setCarouselFilter(g.id)}
                style={{
                  fontFamily: MONO, fontSize: isTouch ? "10px" : "12px", textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  padding: isTouch ? "4px 12px" : "6px 16px", borderRadius: "20px",
                  border: active ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  color: active ? "#e8ddd0" : "rgba(255,255,255,0.3)",
                  cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.3)"; e.currentTarget.style.background = "transparent"; }}}
              >
                {g.id === "all" ? g.label : t("genre_" + g.id)}
              </button>
            );
          })}
        </div>
        {pillsScrollLeft && (
          <div style={{
            position: "absolute", top: 0, left: 0, bottom: 0, width: "48px",
            background: "linear-gradient(to left, transparent, #0f0e0c)",
            pointerEvents: "none",
          }} />
        )}
        {pillsScrollRight && (
          <div style={{
            position: "absolute", top: 0, right: 0, bottom: 0, width: "48px",
            background: "linear-gradient(to right, transparent, #0f0e0c)",
            pointerEvents: "none",
          }} />
        )}
      </div>
    );
  };

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      minHeight: isTouch ? "100dvh" : "100vh", padding: isTouch ? "60px 0 24px" : "80px 0 40px",
      maxWidth: "1200px", margin: "0 auto", width: "100%",
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
        padding: isTouch ? "16px 20px" : "20px 32px",
        maxWidth: "1200px", margin: "0 auto",
        background: "linear-gradient(to bottom, #0f0e0c 60%, transparent)",
        paddingBottom: isTouch ? "32px" : "40px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", minWidth: 0 }}>
            <h1 style={{
              fontFamily: TYPEWRITER, fontSize: isTouch ? "18px" : "20px", fontWeight: 400,
              color: "#e8ddd0", margin: 0, flexShrink: 0,
            }}>
              {t("app_name")}
            </h1>
            {!isTouch && <span style={{
              fontFamily: "'Faustina', serif", fontSize: "13px",
              fontStyle: "italic",
              color: "rgba(255,255,255,0.3)",
              whiteSpace: "nowrap",
            }}>
              {t("tagline")}
            </span>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: "2px", background: "rgba(255,255,255,0.05)", borderRadius: "20px", padding: "2px" }}>
              {[{ id: "rows", icon: TbLayoutListFilled, iconOff: TbLayoutList }, { id: "carousel", icon: MdOutlineViewCarousel, iconOff: MdOutlineViewCarousel }, { id: "activity", icon: GoPulse, iconOff: GoPulse }].map((tab) => {
                const active = homeLayout === tab.id;
                const Icon = active ? tab.icon : tab.iconOff;
                return (
                <button
                  key={tab.id}
                  onClick={() => setHomeLayout(tab.id)}
                  style={{
                    background: active ? "rgba(255,255,255,0.12)" : "transparent",
                    border: "none", borderRadius: "18px",
                    padding: "6px 10px",
                    color: active ? "#e8ddd0" : "rgba(255,255,255,0.35)",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.15s, color 0.15s",
                  }}
                >
                  <Icon size={14} />
                </button>
                );
              })}
            </div>
            <button
              onClick={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)";
                setTimeout(() => onNewStory(), 150);
              }}
              style={{
                padding: isTouch ? "6px 16px" : "8px 20px", borderRadius: "28px",
                background: "#e8ddd0", border: "none", color: "#0f0e0c",
                cursor: "pointer",
                boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                display: "flex", alignItems: "center", gap: "8px",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.95)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.4)"; }}
            >
              <span style={{ fontSize: isTouch ? "14px" : "16px", lineHeight: 1 }}>+</span>
            </button>
          </div>
        </div>
        {homeLayout === "carousel" && isTouch && renderFilterPills()}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: homeLayout === "rows" ? (isTouch ? "16px" : "24px") : 0 }}>
        {homeLayout === "rows" && genreRows.map((r) => (
          <StoryRow
            key={r.genre.id}
            title={t("genre_" + r.genre.id)}
            stories={r.stories}
            onSelectStory={onSelectStory}
            isTouch={isTouch}
            genreId={r.genre.id}
            fontIndexMap={fontIndexMap}
            t={t}
            lang={lang}
            translatedTitles={translatedTitles}
          />
        ))}

        {homeLayout === "carousel" && (() => {
          const carouselBase = carouselFilter === "all"
            ? sorted
            : sorted.filter((s) => s.genre === carouselFilter);
          const needsLoop = carouselFilter === "all" && carouselBase.length > 2;
          const carouselStories = needsLoop
            ? [...carouselBase, ...carouselBase, ...carouselBase]
            : carouselBase;
          return (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
              {!isTouch && (
                <div style={{ padding: "0 32px", marginBottom: "24px" }}>
                  {renderFilterPills()}
                </div>
              )}
              <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center" }}>
                <div style={{
                  position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
                  pointerEvents: "none", zIndex: 1,
                  background: "linear-gradient(to right, #0f0e0c 0%, transparent 48px, transparent calc(100% - 48px), #0f0e0c 100%)",
                }} />
                <div
                  ref={carouselRef}
                  className="story-hscroll"
                  style={{
                    display: "flex", gap: isTouch ? "24px" : "20px",
                    overflowX: "auto", WebkitOverflowScrolling: "touch",
                    padding: isTouch ? "20px calc(50% - 100px)" : "30px 32px",
                    scrollbarWidth: "none", msOverflowStyle: "none",
                    perspective: "none",
                    width: "100%",
                    ...(!needsLoop && !isTouch ? { justifyContent: "center" } : {}),
                    ...(isTouch ? { scrollSnapType: "x mandatory" } : {}),
                  }}
                >
                  {carouselStories.map((s, i) => {
                    const genre = GENRES.find((g) => g.id === s.genre);
                    return (
                      <div
                        key={`${s.id}-${i}`}
                        onClick={(e) => {
                          e.currentTarget.style.transform = "scale(1.08)";
                          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.35)";
                          setTimeout(() => onSelectStory(s.id), 150);
                        }}
                        style={{
                          background: bookColor(s.genre, s.id).bg,
                          border: `1px solid ${bookColor(s.genre, s.id).border}`,
                          borderRadius: "4px",
                          padding: "20px 16px",
                          cursor: "pointer",
                          width: "200px", minWidth: "200px",
                          aspectRatio: "2 / 3",
                          display: "flex", flexDirection: "column", justifyContent: "space-between",
                          transition: "transform 0.2s ease-out, opacity 0.2s ease-out, border-color 0.15s, box-shadow 0.15s",
                          transformStyle: isTouch ? "flat" : "preserve-3d",
                          willChange: isTouch ? "transform" : "auto",
                          ...(isTouch ? { scrollSnapAlign: "center" } : {}),
                        }}
                        {...(!isTouch ? {
                          onMouseMove: (e) => {
                            if (e.buttons) return;
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = (e.clientX - rect.left) / rect.width - 0.5;
                            const y = (e.clientY - rect.top) / rect.height - 0.5;
                            e.currentTarget.style.transform = `perspective(800px) scale(1.08) rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
                            e.currentTarget.style.boxShadow = `${-x * 14}px ${y * 14}px 25px rgba(0,0,0,0.35)`;
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                          },
                          onMouseDown: (e) => {
                            e.currentTarget.style.transform = "scale(0.95)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.3)";
                          },
                          onMouseUp: (e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "none";
                          },
                          onMouseLeave: (e) => {
                            e.currentTarget.style.transform = "scale(1) rotateY(0deg) rotateX(0deg)";
                            e.currentTarget.style.boxShadow = "none";
                            e.currentTarget.style.borderColor = bookColor(s.genre, s.id).border;
                          },
                        } : {})}
                      >
                        <div style={{
                          fontFamily: MONO, fontSize: "9px", color: "rgba(255,255,255,0.5)",
                          textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "center",
                        }}>
                          {genre ? t("genre_" + genre.id) : ""}
                        </div>
                        <div style={{
                          flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", minWidth: 0,
                        }}>
                          <BookTitle style={{
                            fontFamily: storyFontForId(s.genre, s.id, fontIndexMap).family, fontSize: `${Math.round(20 * (storyFontForId(s.genre, s.id, fontIndexMap).scale || 1))}px`, fontWeight: storyFontForId(s.genre, s.id, fontIndexMap).weight || 600,
                            color: "#fff", lineHeight: 1.3, padding: "0 2px", maxWidth: "100%",
                          }}>
                            {s[`title_${lang}`] || translatedTitles[s.id] || s.title || t("untitled")}
                          </BookTitle>
                        </div>
                        <span style={{
                          fontFamily: MONO, fontSize: "11px",
                          color: "rgba(255,255,255,0.45)",
                          textAlign: "center",
                        }}>
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

        {homeLayout === "activity" && (
          <div style={{ maxWidth: "600px", margin: "0 auto", padding: isTouch ? "0" : "0 24px", width: "100%" }}>
            {activityLoading ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, minHeight: "60vh" }}>
                <p style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                  {t("loading_activity")}
                </p>
              </div>
            ) : activityFeed.length === 0 ? (
              <p style={{ fontFamily: MONO, fontSize: "12px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
                {t("no_activity")}
              </p>
            ) : (
              (() => {
                const groups = [];
                for (const entry of activityFeed) {
                  const last = groups[groups.length - 1];
                  if (last && last.storyId === entry.storyId) {
                    last.entries.push(entry);
                  } else {
                    groups.push({ storyId: entry.storyId, storyTitle: entry.storyTitle, storyGenre: entry.storyGenre, entries: [entry] });
                  }
                }
                return groups.map((group, gi) => {
                  const genre = GENRES.find((g) => g.id === group.storyGenre);
                  return (
                  <div
                    key={`${group.storyId}-${gi}`}
                    onClick={() => onSelectStory(group.storyId)}
                    style={{
                      padding: "20px 16px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      transition: "background 0.15s",
                      display: "flex", gap: "20px",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      background: bookColor(group.storyGenre, group.storyId).bg,
                      border: `1px solid ${bookColor(group.storyGenre, group.storyId).border}`,
                      borderRadius: "4px",
                      padding: "12px 10px",
                      width: "100px", minWidth: "100px",
                      height: "150px",
                      display: "flex", flexDirection: "column", justifyContent: "space-between",
                      flexShrink: 0, alignSelf: "flex-start",
                      position: "sticky", top: isTouch ? "70px" : "90px",
                    }}>
                      <div style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", width: "100%", minWidth: 0,
                      }}>
                        <BookTitle style={{
                          fontFamily: storyFontForId(group.storyGenre, group.storyId, fontIndexMap).family, fontSize: `${Math.round(12 * (storyFontForId(group.storyGenre, group.storyId, fontIndexMap).scale || 1))}px`, fontWeight: storyFontForId(group.storyGenre, group.storyId, fontIndexMap).weight || 600,
                          color: "#fff", lineHeight: 1.3, padding: "0 2px", maxWidth: "100%",
                        }}>
                          {group.storyTitle}
                        </BookTitle>
                      </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {group.entries.map((entry, ei) => (
                        <div key={`${entry.passageIndex}-${ei}`} style={{ marginBottom: ei < group.entries.length - 1 ? "20px" : 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                            <span style={{ fontFamily: MONO, fontSize: "11px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
                              {entry.ts ? new Date(entry.ts).toLocaleDateString(lang === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : entry.time || ""}
                            </span>
                            </div>
                          {entry.prompt && (
                            <p style={{
                              fontFamily: MONO, fontSize: "13px", lineHeight: 1.5,
                              color: "rgba(255,255,255,0.5)", margin: "0 0 4px",
                            }}>
                              {entry.prompt}
                            </p>
                          )}
                          {entry.originalAnswer && (
                            <p style={{
                              fontFamily: MONO, fontSize: "14px", lineHeight: 1.6,
                              color: "rgba(255,255,255,0.7)", margin: 0,
                            }}>
                              {entry.originalAnswer}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                });
              })()
            )}
          </div>
        )}
      </div>

      <AppFooter t={t} lang={lang} setLang={setLang} onAbout={onAbout} />

    </div>
  );
}
