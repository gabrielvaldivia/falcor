import { useState } from "react";
import { GoArrowLeft, GoPlus, GoDash } from "react-icons/go";
import { MONO, TYPEWRITER, SERIF } from "../constants/fonts.js";
import { GENRES, ALL_VOICES, ALL_THEMES, ALL_PROTAGONISTS, ALL_TENSIONS, getVoicesForGenre, getThemesForGenre, getProtagonistsForGenre, getTensionsForGenre } from "../constants/genres.js";
import { TRANSLATIONS } from "../constants/translations.js";
import AppFooter from "./AppFooter.jsx";

export default function NewStoryScreen({ onCancel, onCreate, narrow, t, lang, setLang, onAbout }) {
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [selectedProtagonist, setSelectedProtagonist] = useState(null);
  const [selectedTension, setSelectedTension] = useState(null);
  const [activeStep, setActiveStep] = useState("genre");
  const [creating, setCreating] = useState(false);

  const toggleTheme = (id) => {
    setSelectedThemes((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 2) return prev;
      const next = [...prev, id];
      setTimeout(() => advanceFrom("themes"), 150);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!selectedGenre || !selectedVoice || creating) return;
    setCreating(true);
    const id = Date.now();
    const meta = {
      id,
      title: "",
      genre: selectedGenre,
      writingStyle: selectedVoice,
      themes: selectedThemes.length > 0 ? selectedThemes : [],
      protagonist: selectedProtagonist || null,
      tension: selectedTension || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      passageCount: 0,
    };
    await onCreate(meta);
  };

  const steps = [
    { key: "genre", label: t("step_genre"), optional: false },
    { key: "voice", label: t("step_voice"), optional: false },
    { key: "themes", label: t("step_themes"), optional: true },
    { key: "protagonist", label: t("step_protagonist"), optional: true },
    { key: "tension", label: t("step_tension"), optional: true },
  ];

  const getStepAnswer = (key) => {
    switch (key) {
      case "genre": {
        const g = GENRES.find((x) => x.id === selectedGenre);
        return g ? t("genre_" + g.id) : null;
      }
      case "voice": {
        const v = ALL_VOICES.find((x) => x.id === selectedVoice);
        return v ? (t("voice_" + selectedGenre + "_" + v.id) || v.label) : null;
      }
      case "themes": {
        if (selectedThemes.length === 0) return null;
        return selectedThemes.map((id) => {
          const th = ALL_THEMES.find((x) => x.id === id);
          if (!th) return null;
          const k = th.id.replace(/-/g, "_");
          return TRANSLATIONS[lang]?.["theme_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["theme_" + k] || th.label;
        }).filter(Boolean).join(", ");
      }
      case "protagonist": {
        const p = ALL_PROTAGONISTS.find((x) => x.id === selectedProtagonist);
        if (!p) return null;
        const k = p.id.replace(/-/g, "_");
        return TRANSLATIONS[lang]?.["protag_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["protag_" + k] || p.label;
      }
      case "tension": {
        const tn = ALL_TENSIONS.find((x) => x.id === selectedTension);
        if (!tn) return null;
        const k = tn.id.replace(/-/g, "_");
        return TRANSLATIONS[lang]?.["conflict_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["conflict_" + k] || tn.label;
      }
      default: return null;
    }
  };

  const isStepVisible = (key) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(key);
    if (idx === 0) return true;
    for (let i = 0; i < idx; i++) {
      const prev = steps[i];
      if (!prev.optional && !getStepAnswer(prev.key)) return false;
    }
    const activeIdx = order.indexOf(activeStep);
    return activeIdx >= idx || getStepAnswer(order[idx - 1]) !== null || steps[idx - 1].optional;
  };

  const advanceFrom = (key) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(key);
    if (idx < order.length - 1) {
      setActiveStep(order[idx + 1]);
    }
  };

  const handleSelectGenre = (id) => {
    setSelectedGenre(id);
    setSelectedVoice(null);
    setSelectedThemes([]);
    setSelectedProtagonist(null);
    setSelectedTension(null);
    setTimeout(() => advanceFrom("genre"), 150);
  };

  const handleSelectVoice = (id) => {
    setSelectedVoice(id);
    setTimeout(() => advanceFrom("voice"), 150);
  };

  const canCreate = selectedGenre && selectedVoice;

  const renderCollapsedRow = (step, disabled = false) => {
    const answer = getStepAnswer(step.key);
    return (
      <button
        onClick={disabled ? undefined : () => setActiveStep(step.key)}
        style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          width: "100%", background: "none", border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "20px 0",
          lineHeight: "normal",
          font: "inherit",
          cursor: disabled ? "default" : "pointer",
          transition: "all 0.15s",
          opacity: disabled ? 0.3 : 1,
        }}
        onMouseEnter={disabled ? undefined : (e) => e.currentTarget.querySelector("[data-answer]").style.color = "#e8ddd0"}
        onMouseLeave={disabled ? undefined : (e) => e.currentTarget.querySelector("[data-answer]").style.color = "rgba(255,255,255,0.5)"}
      >
        <span style={{
          fontFamily: MONO, fontSize: "12px", fontWeight: 400,
          color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
          textTransform: "uppercase",
        }}>
          {step.label}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span data-answer="" style={{
            fontFamily: SERIF, fontSize: "15px", fontWeight: 500,
            color: "rgba(255,255,255,0.5)",
            transition: "color 0.15s",
          }}>
            {answer || ""}
          </span>
          <GoPlus size={16} style={{ color: "rgba(255,255,255,0.45)", flexShrink: 0 }} />
        </span>
      </button>
    );
  };

  const renderOptionGrid = (items, selectedId, onSelect, multi = false, labelFn = null) => (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
      gap: "10px",
    }}>
      {items.map((item) => {
        const isSelected = multi ? selectedId.includes(item.id) : selectedId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              background: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
              border: isSelected ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.06)",
              borderRadius: "6px",
              padding: "14px 16px",
              cursor: "pointer",
              textAlign: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                e.currentTarget.querySelector("[data-label]").style.color = "#e8ddd0";
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                e.currentTarget.querySelector("[data-label]").style.color = "rgba(255,255,255,0.5)";
              }
            }}
          >
            <div data-label="" style={{
              fontFamily: TYPEWRITER, fontSize: "15px", fontWeight: 400,
              color: isSelected ? "#e8ddd0" : "rgba(255,255,255,0.5)",
              transition: "color 0.15s",
            }}>
              {labelFn ? labelFn(item) : item.label}
            </div>
          </button>
        );
      })}
    </div>
  );

  const collapseStep = (stepKey) => {
    const order = steps.map((s) => s.key);
    const idx = order.indexOf(stepKey);
    for (let i = idx + 1; i < order.length; i++) {
      if (!getStepAnswer(order[i])) { setActiveStep(order[i]); return; }
    }
    setActiveStep(null);
  };

  const renderExpandedStep = (step) => {
    const isOptional = step.optional;
    return (
      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", marginBottom: "0" }}>
          <h2 style={{
            fontFamily: MONO, fontSize: "12px", fontWeight: 400,
            color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
            textTransform: "uppercase", margin: 0,
          }}>
            {step.label}{isOptional && <span style={{ textTransform: "none", color: "rgba(255,255,255,0.45)" }}> {t("optional")}{step.key === "themes" ? t("up_to_2") : ""}</span>}
          </h2>
          <button
            onClick={() => collapseStep(step.key)}
            style={{
              background: "none", border: "none",
              cursor: "pointer", padding: "2px",
              color: "rgba(255,255,255,0.45)",
              transition: "color 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.25)"}
          >
            <GoDash size={16} />
          </button>
        </div>
        {step.key === "genre" && renderOptionGrid(GENRES, selectedGenre, handleSelectGenre, false, (g) => t("genre_" + g.id))}
        {step.key === "voice" && renderOptionGrid(getVoicesForGenre(selectedGenre), selectedVoice, handleSelectVoice, false, (v) => t("voice_" + selectedGenre + "_" + v.id) || v.label)}
        {step.key === "themes" && renderOptionGrid(getThemesForGenre(selectedGenre), selectedThemes, toggleTheme, true, (item) => {
          const k = item.id.replace(/-/g, "_");
          const genreKey = "theme_" + selectedGenre + "_" + k;
          const baseKey = "theme_" + k;
          return TRANSLATIONS[lang]?.[genreKey] || TRANSLATIONS[lang]?.[baseKey] || item.label;
        })}
        {step.key === "protagonist" && (
          <>
            {renderOptionGrid(getProtagonistsForGenre(selectedGenre), selectedProtagonist, (id) => {
              setSelectedProtagonist(selectedProtagonist === id ? null : id);
              if (selectedProtagonist !== id) setTimeout(() => advanceFrom("protagonist"), 150);
            }, false, (item) => {
              const k = item.id.replace(/-/g, "_");
              return TRANSLATIONS[lang]?.["protag_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["protag_" + k] || item.label;
            })}
            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => advanceFrom("protagonist")}
                style={{
                  background: "none", border: "none",
                  fontFamily: MONO, fontSize: "12px",
                  color: "rgba(255,255,255,0.5)", cursor: "pointer", padding: 0,
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
                onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
              >
                {selectedProtagonist ? t("continue_btn") : t("skip")}
              </button>
            </div>
          </>
        )}
        {step.key === "tension" && renderOptionGrid(getTensionsForGenre(selectedGenre), selectedTension, (id) => {
          setSelectedTension(selectedTension === id ? null : id);
          if (selectedTension !== id) setTimeout(() => setActiveStep(null), 150);
        }, false, (item) => {
          const k = item.id.replace(/-/g, "_");
          return TRANSLATIONS[lang]?.["conflict_" + selectedGenre + "_" + k] || TRANSLATIONS[lang]?.["conflict_" + k] || item.label;
        })}
      </div>
    );
  };

  return (
    <>
      {narrow ? (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0,
          zIndex: 10,
          background: "linear-gradient(to bottom, #181714 60%, transparent)",
          padding: "16px 24px",
          display: "flex", alignItems: "center",
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: 0, display: "flex", alignItems: "center",
            }}
          >
            <GoArrowLeft size={16} />
          </button>
          <span style={{
            fontFamily: MONO, fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
            letterSpacing: "0.5px", textTransform: "uppercase",
            flex: 1, textAlign: "center",
            marginRight: "16px",
          }}>
            {t("new_story")}
          </span>
        </div>
      ) : (
        <div style={{
          position: "fixed", left: "24px", top: "24px",
          zIndex: 5,
        }}>
          <button
            onClick={onCancel}
            style={{
              background: "none", border: "none",
              fontFamily: MONO, fontSize: "12px",
              color: "rgba(255,255,255,0.5)", cursor: "pointer",
              padding: 0, textAlign: "left",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
          >
            <GoArrowLeft size={14} style={{ marginRight: "6px", verticalAlign: "middle" }} />{t("back")}
          </button>
        </div>
      )}
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: narrow ? "56px 24px 40px" : "60px 24px 40px" }}>

      {!narrow && (
        <h1 style={{
          fontFamily: SERIF, fontSize: "28px", fontWeight: 600,
          color: "#e8ddd0", textAlign: "center",
          marginBottom: "48px",
        }}>
          {t("new_story")}
        </h1>
      )}

      {steps.map((step) => {
        const answer = getStepAnswer(step.key);
        const isActive = activeStep === step.key;
        const reachable = isStepVisible(step.key);
        const isCollapsed = !isActive && reachable;
        const isFuture = !isActive && !reachable && answer === null;

        if (isActive && reachable) {
          return <div key={step.key}>{renderExpandedStep(step)}</div>;
        }
        if (isCollapsed) {
          return <div key={step.key}>{renderCollapsedRow(step)}</div>;
        }
        if (isFuture) {
          return <div key={step.key}>{renderCollapsedRow(step, true)}</div>;
        }
        return null;
      })}

      {/* Start Story Button */}
      <button
        onClick={handleCreate}
        disabled={!canCreate || creating}
        style={{
          width: "100%",
          background: creating ? "rgba(255,255,255,0.04)" : canCreate ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
          border: "none",
          borderRadius: "6px",
          padding: "14px 16px",
          fontFamily: MONO, fontSize: "13px",
          color: creating ? "#999" : canCreate ? "#e8ddd0" : "rgba(255,255,255,0.15)",
          cursor: canCreate && !creating ? "pointer" : "default",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          transition: "all 0.15s",
          marginTop: "24px",
          animation: creating ? "pulse 1.5s ease-in-out infinite" : "none",
        }}
      >
        {creating ? t("creating") : t("start_story")}
      </button>
    </div>
    <AppFooter t={t} lang={lang} setLang={setLang} onAbout={onAbout} />
    </>
  );
}
