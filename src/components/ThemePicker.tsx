import React, { useState } from "react";
import { themes } from "../data/themes";
import { type ThemeId } from "../types";

interface ThemePickerProps {
  themeId: ThemeId;
  onSelect: (id: ThemeId) => void;
}

const ThemePicker: React.FC<ThemePickerProps> = ({ themeId, onSelect }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="theme-picker-container">
      <button
        className="theme-toggle-btn"
        onClick={() => setOpen((v) => !v)}
        aria-label="Change theme"
        title="Theme"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </button>

      {open && (
        <>
          <div className="theme-backdrop" onClick={() => setOpen(false)} />
          <div className="theme-panel">
            <div className="theme-panel-title">Theme</div>
            <div className="theme-swatches">
              {themes.map((theme) => {
                const accent = theme.css["--accent"];
                const bg = theme.css["--bg"];
                const active = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    className={`theme-swatch ${active ? "swatch-active" : ""}`}
                    onClick={() => {
                      onSelect(theme.id as ThemeId);
                      setOpen(false);
                    }}
                    title={theme.name}
                    style={{
                      background: bg,
                      outline: active ? `2px solid ${accent}` : "2px solid transparent",
                      outlineOffset: 2,
                    }}
                  >
                    <span
                      className="swatch-dot"
                      style={{ background: accent }}
                    />
                    <span className="swatch-name" style={{ color: theme.css["--text"] }}>
                      {theme.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemePicker;