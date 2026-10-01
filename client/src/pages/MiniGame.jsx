import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Gamepad2, Clock, Coins, Leaf, CloudFog, DollarSign, Smile, Award,
  Trophy, RotateCcw, CheckCircle2, Medal,
} from "lucide-react";
import { api } from "../services/api.js";
import { Loading, ErrorState } from "../components/StatusMessage.jsx";

const INITIAL_STATS = { clean: 15, pollution: 70, affordability: 45, happiness: 50, sustainability: 20 };
const INITIAL_BUDGET = 100;
const LEVEL_INCOME = 35;
const LEVEL_SECONDS = 25;

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

export default function MiniGame() {
  const { t, i18n } = useTranslation();
  const [scenarios, setScenarios] = useState([]);
  const [status, setStatus] = useState("loading");
  const [phase, setPhase] = useState("intro"); // intro | playing | finished
  const [playerName, setPlayerName] = useState("");
  const [levelIndex, setLevelIndex] = useState(0);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [timeLeft, setTimeLeft] = useState(LEVEL_SECONDS);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const timerRef = useRef(null);

  const loadScenarios = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await api.getGameScenarios(i18n.language);
      setScenarios(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [i18n.language]);

  useEffect(() => {
    loadScenarios();
  }, [loadScenarios]);

  const applyChoice = useCallback(
    (option) => {
      const { effects } = option;
      setStats((prev) => ({
        clean: clamp(prev.clean + effects.clean),
        pollution: clamp(prev.pollution + effects.pollution),
        affordability: clamp(prev.affordability + effects.affordability),
        happiness: clamp(prev.happiness + effects.happiness),
        sustainability: clamp(prev.sustainability + effects.sustainability),
      }));
      setBudget((prev) => Math.max(0, prev + effects.budget));
      setScore((prev) =>
        prev +
        Math.max(0, effects.sustainability) * 10 +
        Math.max(0, effects.clean) * 3 +
        Math.max(0, effects.happiness) * 3 +
        Math.max(0, -effects.pollution) * 3 +
        Math.max(0, effects.affordability) * 2
      );

      setSelectedOption(null);
      if (levelIndex + 1 >= scenarios.length) {
        setPhase("finished");
      } else {
        setLevelIndex((prev) => prev + 1);
        setBudget((prev) => prev + LEVEL_INCOME);
        setTimeLeft(LEVEL_SECONDS);
      }
    },
    [levelIndex, scenarios.length]
  );

  // Countdown timer for the current level.
  useEffect(() => {
    if (phase !== "playing") return undefined;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          const currentScenario = scenarios[levelIndex];
          if (currentScenario) {
            const fallback = currentScenario.options[currentScenario.options.length - 1];
            applyChoice(fallback);
          }
          return LEVEL_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, levelIndex, scenarios]);

  function startGame() {
    setStats(INITIAL_STATS);
    setBudget(INITIAL_BUDGET + LEVEL_INCOME);
    setScore(0);
    setLevelIndex(0);
    setSelectedOption(null);
    setTimeLeft(LEVEL_SECONDS);
    setScoreSubmitted(false);
    setLeaderboard([]);
    setPhase("playing");
  }

  function confirmChoice() {
    if (selectedOption === null) return;
    const currentScenario = scenarios[levelIndex];
    applyChoice(currentScenario.options[selectedOption]);
  }

  async function submitScore() {
    try {
      await api.submitScore({
        playerName: playerName.trim() || "Anonymous Hero",
        score,
        sustainabilityScore: stats.sustainability,
        levelsCompleted: scenarios.length,
      });
      setScoreSubmitted(true);
      const board = await api.getLeaderboard(10);
      setLeaderboard(board);
    } catch {
      // Leaderboard is a bonus feature; failing silently keeps the game usable offline.
    }
  }

  useEffect(() => {
    if (phase === "finished") {
      api.getLeaderboard(10).then(setLeaderboard).catch(() => {});
    }
  }, [phase]);

  if (status === "loading") return <Loading />;
  if (status === "error") return <ErrorState message={t("common.error")} onRetry={loadScenarios} />;

  const achievements = [
    { id: 1, key: "achievement1", earned: stats.clean >= 50 },
    { id: 2, key: "achievement2", earned: stats.pollution <= 20 },
    { id: 3, key: "achievement3", earned: stats.happiness >= 70 },
    { id: 4, key: "achievement4", earned: stats.sustainability >= 80 },
    { id: 5, key: "achievement5", earned: phase === "finished" },
  ].filter((a) => a.earned);

  return (
    <div>
      <header className="bg-gradient-to-br from-slate-900 to-sdg7-green-dark text-white py-16">
        <div className="container-page text-center">
          <Gamepad2 size={44} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">{t("game.pageTitle")}</h1>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto">{t("game.pageSubtitle")}</p>
        </div>
      </header>

      <div className="container-page py-16">
        {phase === "intro" && (
          <div className="max-w-xl mx-auto card p-8 text-center">
            <p className="text-slate-600 leading-relaxed mb-6">{t("game.intro")}</p>
            <label htmlFor="player-name" className="block text-sm font-semibold text-slate-700 mb-2">
              {t("game.enterName")}
            </label>
            <input
              id="player-name"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t("game.namePlaceholder")}
              maxLength={30}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 mb-6 focus:border-sdg7-green outline-none"
            />
            <button type="button" onClick={startGame} className="btn-primary w-full sm:w-auto">
              <Gamepad2 size={18} aria-hidden="true" />
              {t("game.startGame")}
            </button>
          </div>
        )}

        {phase === "playing" && scenarios[levelIndex] && (
          <GameLevel
            t={t}
            scenario={scenarios[levelIndex]}
            levelIndex={levelIndex}
            totalLevels={scenarios.length}
            stats={stats}
            budget={budget}
            score={score}
            timeLeft={timeLeft}
            selectedOption={selectedOption}
            setSelectedOption={setSelectedOption}
            confirmChoice={confirmChoice}
          />
        )}

        {phase === "finished" && (
          <FinishedScreen
            t={t}
            stats={stats}
            score={score}
            achievements={achievements}
            leaderboard={leaderboard}
            scoreSubmitted={scoreSubmitted}
            onSubmit={submitScore}
            onRestart={() => setPhase("intro")}
          />
        )}
      </div>
    </div>
  );
}

function StatBar({ icon: Icon, label, value, colorClass }) {
  return (
    <div>
      <p className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-1">
        <span className="flex items-center gap-1.5">
          <Icon size={14} aria-hidden="true" />
          {label}
        </span>
        <span>{Math.round(value)}%</span>
      </p>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function GameLevel({
  t, scenario, levelIndex, totalLevels, stats, budget, score, timeLeft, selectedOption, setSelectedOption, confirmChoice,
}) {
  const progressPercent = Math.round(((levelIndex + 1) / totalLevels) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top bar: level progress + timer + budget + score */}
      <div className="card p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="font-bold text-slate-800">
            {t("game.level")} {levelIndex + 1} {t("game.of")} {totalLevels}
          </p>
          <div className="flex items-center gap-4 text-sm font-semibold">
            <span className="flex items-center gap-1.5 text-sdg7-blue">
              <Coins size={16} aria-hidden="true" />
              {t("game.budget")}: {budget}
            </span>
            <span className="flex items-center gap-1.5 text-sdg7-green">
              <Trophy size={16} aria-hidden="true" />
              {t("game.score")}: {score}
            </span>
            <span className={`flex items-center gap-1.5 ${timeLeft <= 5 ? "text-red-500" : "text-slate-500"}`}>
              <Clock size={16} aria-hidden="true" />
              {timeLeft}
              {t("game.seconds")}
            </span>
          </div>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-sdg7-yellow transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="card p-5 mb-6 grid gap-4 sm:grid-cols-2">
        <StatBar icon={Leaf} label={t("game.cleanEnergy")} value={stats.clean} colorClass="bg-sdg7-green" />
        <StatBar icon={CloudFog} label={t("game.pollution")} value={stats.pollution} colorClass="bg-slate-500" />
        <StatBar icon={DollarSign} label={t("game.affordability")} value={stats.affordability} colorClass="bg-sdg7-blue" />
        <StatBar icon={Smile} label={t("game.happiness")} value={stats.happiness} colorClass="bg-sdg7-yellow" />
        <StatBar icon={Award} label={t("game.sustainability")} value={stats.sustainability} colorClass="bg-emerald-600" />
      </div>

      {/* Scenario */}
      <div className="card p-7">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{scenario.title}</h2>
        <p className="text-slate-500 leading-relaxed mb-6">{scenario.description}</p>

        <p className="font-semibold text-slate-700 mb-3">{t("game.chooseAction")}</p>
        <div className="space-y-3">
          {scenario.options.map((option, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSelectedOption(i)}
              aria-pressed={selectedOption === i}
              className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all ${
                selectedOption === i
                  ? "border-sdg7-green bg-green-50"
                  : "border-slate-200 hover:border-sdg7-green/50"
              }`}
            >
              <span className="flex items-center gap-3">
                {selectedOption === i && <CheckCircle2 className="text-sdg7-green shrink-0" size={20} aria-hidden="true" />}
                <span className="text-slate-700">{option.text}</span>
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={confirmChoice}
          disabled={selectedOption === null}
          className="btn-primary w-full sm:w-auto mt-6 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          {t("game.confirmChoice")}
        </button>
      </div>
    </div>
  );
}

function FinishedScreen({ t, stats, score, achievements, leaderboard, scoreSubmitted, onSubmit, onRestart }) {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-8 text-center mb-8">
        <Trophy size={48} className="mx-auto mb-4 text-sdg7-yellow" aria-hidden="true" />
        <h2 className="text-3xl font-extrabold text-slate-800 mb-6">{t("game.gameOverTitle")}</h2>
        <div className="grid grid-cols-2 gap-6 max-w-sm mx-auto mb-8">
          <div>
            <p className="text-3xl font-extrabold text-sdg7-green">{score}</p>
            <p className="text-sm text-slate-500">{t("game.finalScoreLabel")}</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-sdg7-blue">{Math.round(stats.sustainability)}</p>
            <p className="text-sm text-slate-500">{t("game.finalSustainability")}</p>
          </div>
        </div>

        {achievements.length > 0 && (
          <div className="mb-8">
            <h3 className="font-bold text-slate-700 mb-3">{t("game.achievementsUnlocked")}</h3>
            <ul className="space-y-2 max-w-md mx-auto text-left">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-center gap-2 rounded-lg bg-yellow-50 px-4 py-2 text-sm text-slate-700">
                  <Medal size={18} className="text-sdg7-yellow shrink-0" aria-hidden="true" />
                  {t(`game.${a.key}`)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {!scoreSubmitted ? (
            <button type="button" onClick={onSubmit} className="btn-accent">
              <Trophy size={18} aria-hidden="true" />
              {t("game.submitScore")}
            </button>
          ) : (
            <p className="text-sdg7-green font-semibold flex items-center gap-2">
              <CheckCircle2 size={18} aria-hidden="true" />
              {t("game.scoreSubmitted")}
            </p>
          )}
          <button type="button" onClick={onRestart} className="btn-secondary">
            <RotateCcw size={18} aria-hidden="true" />
            {t("game.playAgain")}
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card p-6">
        <h3 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-4">
          <Trophy size={20} className="text-sdg7-yellow" aria-hidden="true" />
          {t("game.leaderboardTitle")}
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-slate-400 text-sm">{t("game.leaderboardEmpty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th scope="col" className="py-2 pr-4">{t("game.rank")}</th>
                  <th scope="col" className="py-2 pr-4">{t("game.player")}</th>
                  <th scope="col" className="py-2 pr-4">{t("game.score")}</th>
                  <th scope="col" className="py-2">{t("game.sustainability")}</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="py-2 pr-4 font-semibold text-slate-700">#{i + 1}</td>
                    <td className="py-2 pr-4 text-slate-700">{row.playerName}</td>
                    <td className="py-2 pr-4 text-sdg7-green font-semibold">{row.score}</td>
                    <td className="py-2 text-slate-500">{row.sustainabilityScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
