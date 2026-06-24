import { useState, useEffect, useCallback } from "react";
import { FiCheck, FiSave, FiRefreshCw, FiEye, FiSun, FiMoon, FiDroplet, FiType, FiSliders } from "react-icons/fi";
import toast from "react-hot-toast";
import { useSettings } from "../../../context/SettingsContext";
import { settingsApi } from "../../../api/settingsApi";
import "./ThemeBuilderPage.css";

/* ─── Preset Themes ─────────────────────────────────────────────────────────── */
const PRESETS = [
  {
    id: "agro-green",
    name: "Axiom Seeds Green",
    desc: "Original earthy organic",
    swatch: ["#1F7A3D", "#C68A3A", "#faf7f2"],
    colorPrimary:   "#1F7A3D",
    colorSecondary: "#C68A3A",
    colorBg:        "#faf7f2",
    colorCard:      "#ffffff",
    colorText:      "#1A1A1A",
    colorBorder:    "#E8E0D5",
    fontBody:       "Inter",
    fontDisplay:    "Playfair Display",
    borderRadius:   "16px",
    buttonRadius:   "14px",
  },
  {
    id: "forest-dark",
    name: "Dark Forest",
    desc: "Deep greens, night mode",
    swatch: ["#4ABA72", "#E5A754", "#0F1612"],
    colorPrimary:   "#4ABA72",
    colorSecondary: "#E5A754",
    colorBg:        "#0F1612",
    colorCard:      "#1A2420",
    colorText:      "#F0EDE8",
    colorBorder:    "#2A3830",
    fontBody:       "Inter",
    fontDisplay:    "Playfair Display",
    borderRadius:   "16px",
    buttonRadius:   "14px",
    siteTheme:      "dark",
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    desc: "Cool aqua tones",
    swatch: ["#0077B6", "#00B4D8", "#F0F8FF"],
    colorPrimary:   "#0077B6",
    colorSecondary: "#00B4D8",
    colorBg:        "#F0F8FF",
    colorCard:      "#ffffff",
    colorText:      "#0A1628",
    colorBorder:    "#BFDBFE",
    fontBody:       "Inter",
    fontDisplay:    "Merriweather",
    borderRadius:   "20px",
    buttonRadius:   "12px",
  },
  {
    id: "harvest-amber",
    name: "Harvest Amber",
    desc: "Warm wheat & gold",
    swatch: ["#B45309", "#F59E0B", "#FFFBEB"],
    colorPrimary:   "#B45309",
    colorSecondary: "#F59E0B",
    colorBg:        "#FFFBEB",
    colorCard:      "#ffffff",
    colorText:      "#1C1501",
    colorBorder:    "#FDE68A",
    fontBody:       "Lato",
    fontDisplay:    "Lora",
    borderRadius:   "12px",
    buttonRadius:   "10px",
  },
  {
    id: "royal-purple",
    name: "Royal Purple",
    desc: "Premium violet luxury",
    swatch: ["#7C3AED", "#C4B5FD", "#FAF5FF"],
    colorPrimary:   "#7C3AED",
    colorSecondary: "#C4B5FD",
    colorBg:        "#FAF5FF",
    colorCard:      "#ffffff",
    colorText:      "#1E0A3C",
    colorBorder:    "#DDD6FE",
    fontBody:       "Nunito",
    fontDisplay:    "Cormorant Garamond",
    borderRadius:   "24px",
    buttonRadius:   "20px",
  },
  {
    id: "modern-slate",
    name: "Modern Slate",
    desc: "Minimal monochrome",
    swatch: ["#1E293B", "#64748B", "#F8FAFC"],
    colorPrimary:   "#1E293B",
    colorSecondary: "#64748B",
    colorBg:        "#F8FAFC",
    colorCard:      "#ffffff",
    colorText:      "#0F172A",
    colorBorder:    "#E2E8F0",
    fontBody:       "DM Sans",
    fontDisplay:    "DM Serif Display",
    borderRadius:   "8px",
    buttonRadius:   "8px",
  },
  {
    id: "rose-bloom",
    name: "Rose Bloom",
    desc: "Floral feminine warmth",
    swatch: ["#E11D48", "#FB7185", "#FFF1F2"],
    colorPrimary:   "#E11D48",
    colorSecondary: "#FB7185",
    colorBg:        "#FFF1F2",
    colorCard:      "#ffffff",
    colorText:      "#1A0010",
    colorBorder:    "#FECDD3",
    fontBody:       "Poppins",
    fontDisplay:    "Cormorant Garamond",
    borderRadius:   "20px",
    buttonRadius:   "20px",
  },
  {
    id: "night-carbon",
    name: "Night Carbon",
    desc: "Ultra dark minimal",
    swatch: ["#d6a46a", "#b97b39", "#090909"],
    colorPrimary:   "#d6a46a",
    colorSecondary: "#b97b39",
    colorBg:        "#090909",
    colorCard:      "#111111",
    colorText:      "#ffffff",
    colorBorder:    "#1f1f1f",
    fontBody:       "Inter",
    fontDisplay:    "Playfair Display",
    borderRadius:   "16px",
    buttonRadius:   "12px",
    siteTheme:      "dark",
  },
];

const FONT_PAIRS = [
  { body: "Inter",       display: "Playfair Display",     label: "Inter + Playfair" },
  { body: "Lato",        display: "Lora",                 label: "Lato + Lora" },
  { body: "Nunito",      display: "Cormorant Garamond",   label: "Nunito + Cormorant" },
  { body: "DM Sans",     display: "DM Serif Display",     label: "DM Sans + DM Serif" },
  { body: "Poppins",     display: "Playfair Display",     label: "Poppins + Playfair" },
  { body: "Roboto",      display: "Merriweather",         label: "Roboto + Merriweather" },
  { body: "Source Sans 3", display: "Source Serif 4",     label: "Source Sans + Source Serif" },
  { body: "Outfit",      display: "Fraunces",             label: "Outfit + Fraunces" },
];

const RADIUS_OPTIONS = [
  { label: "Sharp",    value: "4px"  },
  { label: "Soft",     value: "12px" },
  { label: "Rounded",  value: "16px" },
  { label: "Pill",     value: "24px" },
];

export default function ThemeBuilderPage() {
  const { settings, setSettings } = useSettings();
  const [draft,   setDraft]   = useState({});
  const [saving,  setSaving]  = useState(false);
  const [tab,     setTab]     = useState("presets"); // presets | colors | fonts | layout
  const [preview, setPreview] = useState(false);

  // Init draft from live settings
  useEffect(() => {
    setDraft({
      themePreset:    settings.themePreset    || "agro-green",
      siteTheme:      settings.siteTheme      || "light",
      colorPrimary:   settings.colorPrimary   || "#1F7A3D",
      colorSecondary: settings.colorSecondary || "#C68A3A",
      colorBg:        settings.colorBg        || "#faf7f2",
      colorCard:      settings.colorCard      || "#ffffff",
      colorText:      settings.colorText      || "#1A1A1A",
      colorBorder:    settings.colorBorder    || "#E8E0D5",
      fontBody:       settings.fontBody       || "Inter",
      fontDisplay:    settings.fontDisplay    || "Playfair Display",
      borderRadius:   settings.borderRadius   || "16px",
      buttonRadius:   settings.buttonRadius   || "14px",
    });
  }, [settings]);

  // Live preview: push draft into context without saving
  const livePreview = useCallback((patch) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (preview) setSettings(next);
  }, [draft, preview, setSettings]);

  const togglePreview = () => {
    setPreview(p => {
      if (!p) setSettings(draft); // enable: push draft now
      else     setSettings(settings); // disable: revert to saved
      return !p;
    });
  };

  const applyPreset = (preset) => {
    const patch = {
      themePreset:    preset.id,
      siteTheme:      preset.siteTheme || "light",
      colorPrimary:   preset.colorPrimary,
      colorSecondary: preset.colorSecondary,
      colorBg:        preset.colorBg,
      colorCard:      preset.colorCard,
      colorText:      preset.colorText,
      colorBorder:    preset.colorBorder,
      fontBody:       preset.fontBody,
      fontDisplay:    preset.fontDisplay,
      borderRadius:   preset.borderRadius,
      buttonRadius:   preset.buttonRadius,
    };
    livePreview(patch);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await settingsApi.update(draft);
      setSettings(res.data);
      toast.success("Theme saved & applied live! 🎨");
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Save failed";
      console.error("ThemeBuilder save error:", err);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    const preset = PRESETS.find(p => p.id === "agro-green");
    applyPreset(preset);
    toast("Reset to default theme");
  };

  const field = (key) => ({
    value: draft[key] || "",
    onChange: (e) => livePreview({ [key]: e.target.value }),
  });

  const activePreset = PRESETS.find(p => p.id === draft.themePreset);

  return (
    <div className="theme-builder">

      {/* ── Header ── */}
      <div className="tb-header">
        <div>
          <h1>Theme Builder</h1>
          <p>Apply a preset or fine-tune every detail — changes preview live</p>
        </div>
        <div className="tb-header-actions">
          <button className={`btn btn-ghost btn-sm tb-preview-btn ${preview ? "active" : ""}`} onClick={togglePreview}>
            <FiEye /> {preview ? "Live Preview On" : "Preview Off"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={reset}>
            <FiRefreshCw /> Reset
          </button>
          <button className="btn btn-primary btn-md" onClick={save} disabled={saving}>
            <FiSave /> {saving ? "Saving…" : "Save & Apply"}
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tb-tabs">
        {[
          { id: "presets", icon: <FiDroplet />, label: "Presets" },
          { id: "colors",  icon: <FiDroplet />, label: "Colors"  },
          { id: "fonts",   icon: <FiType    />, label: "Fonts"   },
          { id: "layout",  icon: <FiSliders />, label: "Layout"  },
        ].map(t => (
          <button key={t.id} className={`tb-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="tb-body">

        {/* ═══ PRESETS TAB ═══ */}
        {tab === "presets" && (
          <div className="tb-panel">
            <div className="tb-section-title">
              <FiDroplet /> Choose a theme preset — 1 click to transform the entire site
            </div>

            <div className="preset-grid">
              {PRESETS.map(preset => (
                <button
                  key={preset.id}
                  className={`preset-card ${draft.themePreset === preset.id ? "selected" : ""}`}
                  onClick={() => applyPreset(preset)}
                >
                  {/* Colour swatches */}
                  <div className="preset-swatches">
                    {preset.swatch.map((c, i) => (
                      <div key={i} className="preset-swatch" style={{ background: c }} />
                    ))}
                  </div>

                  {/* Mini preview */}
                  <div className="preset-preview" style={{ background: preset.colorBg, border: `1px solid ${preset.colorBorder}` }}>
                    <div className="pp-header" style={{ background: preset.colorPrimary }} />
                    <div className="pp-card"   style={{ background: preset.colorCard, borderRadius: parseInt(preset.borderRadius)/2 }}>
                      <div className="pp-line" style={{ background: preset.colorText,    width: "70%", opacity: 0.8 }} />
                      <div className="pp-line" style={{ background: preset.colorText,    width: "50%", opacity: 0.4 }} />
                      <div className="pp-btn"  style={{ background: preset.colorPrimary, borderRadius: parseInt(preset.buttonRadius)/2 }} />
                    </div>
                  </div>

                  <div className="preset-info">
                    <div className="preset-name">
                      {preset.name}
                      {draft.themePreset === preset.id && <FiCheck className="preset-check" />}
                    </div>
                    <div className="preset-desc">{preset.desc}</div>
                    {preset.siteTheme === "dark" && (
                      <span className="preset-badge dark"><FiMoon /> Dark</span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Dark mode toggle */}
            <div className="tb-switch-row">
              <div>
                <div className="tb-switch-label">Dark Mode</div>
                <div className="tb-switch-sub">Overrides background & text colours for night use</div>
              </div>
              <button
                className={`tb-mode-btn ${draft.siteTheme === "dark" ? "dark" : "light"}`}
                onClick={() => livePreview({ siteTheme: draft.siteTheme === "dark" ? "light" : "dark" })}
              >
                {draft.siteTheme === "dark" ? <><FiMoon /> Dark</> : <><FiSun /> Light</>}
              </button>
            </div>
          </div>
        )}

        {/* ═══ COLORS TAB ═══ */}
        {tab === "colors" && (
          <div className="tb-panel">
            <div className="tb-section-title"><FiDroplet /> Fine-tune individual colours</div>

            <div className="color-grid">
              {[
                { key: "colorPrimary",   label: "Primary",   desc: "Buttons, links, highlights" },
                { key: "colorSecondary", label: "Secondary", desc: "Accents, badges, icons" },
                { key: "colorBg",        label: "Background",desc: "Page background" },
                { key: "colorCard",      label: "Card",      desc: "Cards, panels, modals" },
                { key: "colorText",      label: "Text",      desc: "Body text colour" },
                { key: "colorBorder",    label: "Border",    desc: "Dividers, outlines" },
              ].map(({ key, label, desc }) => (
                <div key={key} className="color-field">
                  <div className="color-field-top">
                    <div className="color-swatch-wrap">
                      <div className="color-swatch-lg" style={{ background: draft[key] }} />
                      <input type="color" className="color-input-hidden" {...field(key)} />
                    </div>
                    <div className="color-field-info">
                      <div className="color-field-label">{label}</div>
                      <div className="color-field-desc">{desc}</div>
                    </div>
                  </div>
                  <input type="text" className="color-hex-input input-field" {...field(key)} maxLength={7} placeholder="#000000" />
                </div>
              ))}
            </div>

            {/* Live colour ring preview */}
            <div className="color-ring-preview">
              <div className="crp-label">Colour Preview</div>
              <div className="crp-bar" style={{ background: draft.colorBg, border: `1px solid ${draft.colorBorder}` }}>
                <div className="crp-text" style={{ color: draft.colorText }}>Axiom Seeds</div>
                <div className="crp-btn-primary"   style={{ background: draft.colorPrimary,   borderRadius: draft.buttonRadius }}>Buy Now</div>
                <div className="crp-btn-secondary" style={{ border: `2px solid ${draft.colorBorder}`, color: draft.colorText, borderRadius: draft.buttonRadius }}>Learn More</div>
                <div className="crp-badge"         style={{ background: draft.colorSecondary  }}>New</div>
                <div className="crp-card"          style={{ background: draft.colorCard, border: `1px solid ${draft.colorBorder}`, borderRadius: draft.borderRadius }}>
                  <span style={{ color: draft.colorText }}>Card</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ FONTS TAB ═══ */}
        {tab === "fonts" && (
          <div className="tb-panel">
            <div className="tb-section-title"><FiType /> Typography — pick a pairing or choose individually</div>

            <div className="font-pairs-grid">
              {FONT_PAIRS.map(pair => (
                <button
                  key={pair.label}
                  className={`font-pair-card ${draft.fontBody === pair.body && draft.fontDisplay === pair.display ? "selected" : ""}`}
                  onClick={() => livePreview({ fontBody: pair.body, fontDisplay: pair.display })}
                >
                  <div className="fp-display" style={{ fontFamily: `'${pair.display}', Georgia, serif` }}>Heading</div>
                  <div className="fp-body"    style={{ fontFamily: `'${pair.body}', sans-serif` }}>Body text</div>
                  <div className="fp-label">{pair.label}</div>
                  {draft.fontBody === pair.body && draft.fontDisplay === pair.display && <FiCheck className="fp-check" />}
                </button>
              ))}
            </div>

            <div className="font-custom-row">
              <div className="form-group">
                <label>Body Font</label>
                <input className="input-field" placeholder="e.g. Inter" {...field("fontBody")} />
              </div>
              <div className="form-group">
                <label>Display / Heading Font</label>
                <input className="input-field" placeholder="e.g. Playfair Display" {...field("fontDisplay")} />
              </div>
            </div>

            {/* Live font preview */}
            <div className="font-preview-box" style={{ background: draft.colorBg, border: `1px solid ${draft.colorBorder}`, borderRadius: draft.borderRadius }}>
              <div className="fpb-heading" style={{ fontFamily: `'${draft.fontDisplay}', Georgia, serif`, color: draft.colorText }}>
                Grow More. Worry Less. Harvest Better.
              </div>
              <div className="fpb-body" style={{ fontFamily: `'${draft.fontBody}', sans-serif`, color: draft.colorText, opacity: 0.7 }}>
                From certified seeds to organic fertilizers — everything your farm needs, delivered to your door.
              </div>
              <div className="fpb-btn" style={{ background: draft.colorPrimary, borderRadius: draft.buttonRadius, fontFamily: `'${draft.fontBody}', sans-serif` }}>
                Shop Now
              </div>
            </div>
          </div>
        )}

        {/* ═══ LAYOUT TAB ═══ */}
        {tab === "layout" && (
          <div className="tb-panel">
            <div className="tb-section-title"><FiSliders /> Shape & Radius — controls roundness of all elements</div>

            <div className="radius-section">
              <div className="radius-label">Card / Container Radius</div>
              <div className="radius-options">
                {RADIUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`radius-opt ${draft.borderRadius === opt.value ? "selected" : ""}`}
                    onClick={() => livePreview({ borderRadius: opt.value })}
                  >
                    <div className="radius-demo" style={{ borderRadius: opt.value, background: draft.colorPrimary }} />
                    <div className="radius-opt-label">{opt.label}</div>
                    <div className="radius-opt-val">{opt.value}</div>
                  </button>
                ))}
              </div>
              <div className="form-group" style={{ maxWidth: 280 }}>
                <label>Custom Card Radius</label>
                <input className="input-field" placeholder="e.g. 20px" {...field("borderRadius")} />
              </div>
            </div>

            <div className="radius-section">
              <div className="radius-label">Button Radius</div>
              <div className="radius-options">
                {RADIUS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`radius-opt ${draft.buttonRadius === opt.value ? "selected" : ""}`}
                    onClick={() => livePreview({ buttonRadius: opt.value })}
                  >
                    <div className="radius-demo btn-shape" style={{ borderRadius: opt.value, background: draft.colorPrimary }} />
                    <div className="radius-opt-label">{opt.label}</div>
                    <div className="radius-opt-val">{opt.value}</div>
                  </button>
                ))}
              </div>
              <div className="form-group" style={{ maxWidth: 280 }}>
                <label>Custom Button Radius</label>
                <input className="input-field" placeholder="e.g. 14px" {...field("buttonRadius")} />
              </div>
            </div>

            {/* Combined preview */}
            <div className="layout-preview" style={{ background: draft.colorBg, border: `1px solid ${draft.colorBorder}` }}>
              <div className="lp-card" style={{ background: draft.colorCard, borderRadius: draft.borderRadius, border: `1px solid ${draft.colorBorder}` }}>
                <div style={{ width: 40, height: 40, borderRadius: draft.borderRadius, background: draft.colorPrimary, marginBottom: 12 }} />
                <div style={{ width: "70%", height: 12, borderRadius: 4, background: draft.colorText, opacity: 0.7, marginBottom: 8 }} />
                <div style={{ width: "50%", height: 10, borderRadius: 4, background: draft.colorText, opacity: 0.3, marginBottom: 16 }} />
                <div style={{ height: 38, borderRadius: draft.buttonRadius, background: draft.colorPrimary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#fff", fontSize: 13, fontWeight: 600 }}>Shop Now</span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>{/* /tb-body */}

      {/* ── Floating save bar ── */}
      <div className="tb-save-bar">
        <div className="tb-save-info">
          {activePreset ? (
            <>Active preset: <strong>{activePreset.name}</strong></>
          ) : "Custom theme"}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className={`btn btn-ghost btn-sm tb-preview-btn ${preview ? "active" : ""}`} onClick={togglePreview}>
            <FiEye /> {preview ? "Preview On" : "Preview Off"}
          </button>
          <button className="btn btn-primary btn-md" onClick={save} disabled={saving}>
            <FiSave /> {saving ? "Saving…" : "Save & Apply Live"}
          </button>
        </div>
      </div>

    </div>
  );
}
