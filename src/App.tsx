import React from "react";
import { useGame } from "./hooks/useGame";
import { useTheme } from "./hooks/useTheme";
import { useAppView } from "./hooks/useAppView";
import GameGrid from "./components/GameGrid";
import StatsBar from "./components/StatsBar";
import SizeNavbar from "./components/SizeNavbar";
import ThemePicker from "./components/ThemePicker";
import EndModal from "./components/EndModal";
import AppTabs from "./components/AppTabs";
import DailyScreen from "./components/DailyScreen";
import ModesScreen from "./components/ModesScreen";

const App: React.FC = () => {
  const game = useGame();
  const { themeId, setThemeId } = useTheme();
  const { view, setView } = useAppView();

  const canUseNegative = game.sizeConfig.allowNegative;

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <span className="app-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span>NumSum</span>
          </span>
        </div>
        <div className="header-right">
          {/* Negative toggle — only on standard view, sizes that support it */}
          {view === "standard" && canUseNegative && (
            <button
              className={`neg-toggle ${game.negativeEnabled ? "neg-toggle-on" : ""}`}
              onClick={() => game.setNegativeEnabled(!game.negativeEnabled)}
              title={game.negativeEnabled ? "Negative numbers ON" : "Negative numbers OFF"}
            >
              <span className="neg-toggle-symbol">±</span>
              <span className="neg-toggle-label">
                {game.negativeEnabled ? "Negatives On" : "Negatives Off"}
              </span>
            </button>
          )}
          {/* New game only relevant on standard */}
          {view === "standard" && (
            <button className="new-game-btn" onClick={() => game.resetGame()}>
              New Game
            </button>
          )}
          <ThemePicker themeId={themeId} onSelect={setThemeId} />
        </div>
      </header>

      {/* ── Tab Navigation ── */}
      <AppTabs view={view} onSelect={setView} />

      {/* ── Views ── */}
      {view === "standard" && (
        <>
          <SizeNavbar sizeIndex={game.sizeIndex} onSelectSize={game.setSizeIndex} />

          <StatsBar
            hearts={game.hearts}
            progress={game.progress}
            time={game.time}
          />

          <main className="game-area">
            <GameGrid
              puzzle={game.puzzle}
              playerB={game.playerB}
              wrongCells={game.wrongCells}
              blinkingCells={game.blinkingCells}
              onCellClick={game.handleCellClick}
              longPressHandlers={game.longPressHandlers}
            />
          </main>

          <div className="hints">
            <span>Left click → Fill</span>
            <span className="hint-sep">·</span>
            <span>Right click / Long press → Erase</span>
          </div>

          {game.gameOver && (
            <EndModal
              showCelebration={game.showCelebration}
              hearts={game.hearts}
              time={game.time}
              progress={game.progress}
              onReset={() => game.resetGame()}
            />
          )}
        </>
      )}

      {view === "daily" && <DailyScreen />}

      {view === "modes" && <ModesScreen />}
    </div>
  );
};

export default App;