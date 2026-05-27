import React from "react";
import { formatTime } from "../utils/puzzle";

interface EndModalProps {
  showCelebration: boolean;
  hearts: number;
  time: number;
  progress: number;
  onReset: () => void;
}

const EndModal: React.FC<EndModalProps> = ({
  showCelebration,
  hearts,
  time,
  progress,
  onReset,
}) => {
  return (
    <div className="modal-overlay">
      <div className="modal-backdrop" />
      <div className="modal-card">
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

        <button className="play-again-btn" onClick={onReset}>
          Play Again
        </button>
      </div>
    </div>
  );
};

export default EndModal;