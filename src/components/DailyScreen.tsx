import React from "react";
import { useDailyPuzzle } from "../hooks/useDailyPuzzle";
import GameGrid from "./GameGrid";
import StatsBar from "./StatsBar";
import { todayKey } from "../utils/dailySeed";

const DailyScreen: React.FC = () => {
  const daily = useDailyPuzzle();
  const dateKey = todayKey();

  const [year, month, day] = dateKey.split("-").map(Number);
  const dateLabel = new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  // Already finished (solved or lost) — show result card
  if (daily.alreadySolved && daily.todayRecord) {
    const rec = daily.todayRecord;
    return (
      <div className="daily-screen">
        <div className="daily-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className="daily-title">Daily Puzzle</span>
        </div>
        <div className="daily-date">{dateLabel}</div>

        <div className="daily-solved-card">
          <div className="daily-solved-icon">
            {rec.solved ? (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--error)" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
          </div>
          <div className="daily-solved-title">{rec.solved ? "Solved!" : "Game Over"}</div>
          <div className="daily-solved-sub">
            {rec.solved ? "You already solved today's puzzle." : "You ran out of hearts today."}
          </div>

          {rec.solved && (
            <div className="daily-stats">
              <div className="daily-stat">
                <span className="daily-stat-val">{daily.formatTime(rec.time)}</span>
                <span className="daily-stat-lbl">Time</span>
              </div>
              <div className="daily-stat-div" />
              <div className="daily-stat">
                <span className="daily-stat-val">{rec.hearts}</span>
                <span className="daily-stat-lbl">Hearts left</span>
              </div>
            </div>
          )}

          <div className="daily-comeback">Come back tomorrow for a new puzzle!</div>
        </div>
      </div>
    );
  }

  return (
    <div className="daily-screen">
      <div className="daily-header">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="daily-title">Daily Puzzle</span>
      </div>
      <div className="daily-date">{dateLabel}</div>
      <div className="daily-size-note">Medium · 7×7 · One attempt per day</div>

      {/* Same StatsBar as all other modes */}
      <StatsBar
        hearts={daily.hearts}
        progress={daily.progress}
        time={daily.time}
      />

      <main className="game-area">
        <GameGrid
          puzzle={daily.puzzle}
          playerB={daily.playerB}
          wrongCells={daily.wrongCells}
          blinkingCells={daily.blinkingCells}
          onCellClick={daily.handleCellClick}
          longPressHandlers={daily.longPressHandlers}
        />
      </main>

      <div className="hints">
        <span>Left click → Fill</span>
        <span className="hint-sep">·</span>
        <span>Right click / Long press → Erase</span>
      </div>

      {/* End modal — no replay for daily */}
      {daily.gameOver && (
        <div className="modal-overlay">
          <div className="modal-backdrop" />
          <div className="modal-card">
            <div className={`modal-icon ${daily.showCelebration ? "icon-win" : "icon-lose"}`}>
              {daily.showCelebration ? (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              )}
            </div>

            <h2 className="modal-title">
              {daily.showCelebration ? "Daily Solved!" : "Game Over"}
            </h2>
            <p className="modal-subtitle">
              {daily.showCelebration
                ? `Finished in ${daily.formatTime(daily.time)}`
                : "Better luck tomorrow!"}
            </p>

            {daily.showCelebration && (
              <div className="modal-stats">
                <div className="stat-item">
                  <span className="stat-value">{daily.formatTime(daily.time)}</span>
                  <span className="stat-label">Time</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">{daily.hearts}</span>
                  <span className="stat-label">Hearts</span>
                </div>
              </div>
            )}

            <p className="modal-subtitle" style={{ marginTop: 8, opacity: 0.7 }}>
              Come back tomorrow for a new puzzle!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyScreen;