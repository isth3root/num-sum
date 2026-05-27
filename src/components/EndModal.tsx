import React, { useRef, useState } from "react";
import { formatTime } from "../utils/puzzle";
import { type Difficulty } from "../types";

interface EndModalProps {
  showCelebration: boolean;
  hearts: number;
  time: number;
  progress: number;
  sizeLabel?: string;
  difficulty?: Difficulty;
  onReset: () => void;
}

const DIFF_DISPLAY: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: "Easy",   color: "var(--accent-2)" },
  medium: { label: "Medium", color: "#f59e0b" },
  hard:   { label: "Hard",   color: "#ef4444" },
};

const EndModal: React.FC<EndModalProps> = ({
  showCelebration,
  hearts,
  time,
  progress,
  sizeLabel,
  difficulty,
  onReset,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const diff = difficulty ? DIFF_DISPLAY[difficulty] : null;

  const handleShare = async () => {
    setSharing(true);
    setShareError("");
    try {
      // Dynamically import html2canvas to keep bundle small
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current!, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) { setShareError("Screenshot failed"); setSharing(false); return; }
        const file = new File([blob], "numgrid-result.png", { type: "image/png" });

        // Try native share (mobile) first, fall back to download
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "NumGrid Result" });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = "numgrid-result.png"; a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        setSharing(false);
      }, "image/png");
    } catch (err) {
      setShareError("Could not capture screenshot");
      setSharing(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" />
      <div className="modal-card" ref={cardRef}>
        <div className={`modal-icon ${showCelebration ? "icon-win" : "icon-lose"}`}>
          {showCelebration ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </div>

        <h2 className="modal-title">
          {showCelebration ? "Solved!" : "Game Over"}
        </h2>

        {/* Size + difficulty badge — only in standard mode */}
        {sizeLabel && diff && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontFamily: "Sora, sans-serif", fontWeight: 600 }}>
              {sizeLabel}
            </span>
            <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)" }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: diff.color, fontFamily: "Sora, sans-serif" }}>
              {diff.label}
            </span>
          </div>
        )}

        <p className="modal-subtitle">
          {showCelebration
            ? `Completed in ${formatTime(time)}`
            : "Out of hearts — try again"}
        </p>

        <div className="modal-stats">
          <div className="stat-item">
            <span className="stat-value">{formatTime(time)}</span>
            <span className="stat-label">Time</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{hearts}</span>
            <span className="stat-label">Hearts</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value">{progress}%</span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, width: "100%", marginTop: 4 }}>
          <button className="play-again-btn" onClick={onReset} style={{ flex: 1 }}>
            Play Again
          </button>
          <button
            className="share-btn"
            onClick={handleShare}
            disabled={sharing}
            title="Share result"
          >
            {sharing ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.22-8.56" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>
        </div>

        {shareError && (
          <p style={{ fontSize: 11, color: "var(--error)", marginTop: 4, textAlign: "center" }}>{shareError}</p>
        )}
      </div>
    </div>
  );
};

export default EndModal;