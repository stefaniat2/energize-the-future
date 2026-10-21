import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Gamepad2, Clock, Coins, Leaf, CloudFog, DollarSign, Smile, Award,
  Trophy, RotateCcw, CheckCircle2, Medal, ArrowRight, Lock, TimerOff,
} from "lucide-react";
import { api } from "../services/api.js";
import { useLocalStorage } from "../hooks/useLocalStorage.js";
import {
  INITIAL_STATS, applyEffects, scoreForEffects, costOf, isLocked, earnedAchievements,
} from "../utils/game.js";
import { Loading, ErrorState } from "../components/StatusMessage.jsx";

const INITIAL_BUDGET = 100;
const LEVEL_INCOME = 20;
const LEVEL_SECONDS = 25;

// For these stats a *decrease* is the good outcome.
const LOWER_IS_BETTER = new Set(["pollution"]);

const STAT_META = {
  clean: { icon: Leaf, labelKey: "game.cleanEnergy", bar: "bg-sdg7-green" },
  pollution: { icon: CloudFog, labelKey: "game.pollution", bar: "bg-slate-500" },
  affordability: { icon: DollarSign, labelKey: "game.affordability", bar: "bg-sdg7-blue" },
  happiness: { icon: Smile, labelKey: "game.happiness", bar: "bg-sdg7-yellow" },
  sustainability: { icon: Award, labelKey: "game.sustainability", bar: "bg-emerald-600" },
};

export default function MiniGame() {
  const { t, i18n } = useTranslation();
  const [scenarios, setScenarios] = useState([]);
  const [status, setStatus] = useState("loading");
  const [phase, setPhase] = useState("intro"); // intro | playing | finished
  const [playerName, setPlayerName] = useLocalStorage("etf_player_name", "");
  const [levelIndex, setLevelIndex] = useState(0);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [budget, setBudget] = useState(INITIAL_BUDGET);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [outcome, setOutcome] = useState(null); // result of the decision just made
  const [timeLeft, setTimeLeft] = useState(LEVEL_SECONDS);
  const [leaderboard, setLeaderboard] = useState([]);
  const [scoreSubmitted, setScoreSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const loadLeaderboard = useCallback(() => {
    api.getLeaderboard(10).then(setLeaderboard).catch(() => {});
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const applyChoice = useCallback((option, timedOut = false) => {
    const { effects } = option;
    setStats((prev) => applyEffects(prev, effects));
    setBudget((prev) => Math.max(0, prev + effects.budget));
    setScore((prev) => prev + scoreForEffects(effects));
    setSelectedOption(null);
    setOutcome({ effects, optionText: option.text, timedOut });
  }, []);

  // Countdown: only ticks while a decision is pending.
  useEffect(() => {
    if (phase !== "playing" || outcome) return undefined;
    const id = setInterval(() => setTimeLeft((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(id);
  }, [phase, outcome, levelIndex]);

  // When time runs out the cheapest option (the last one) is chosen automatically.
  useEffect(() => {
    if (phase === "playing" && !outcome && timeLeft === 0) {
      const scenario = scenarios[levelIndex];
      if (scenario) applyChoice(scenario.options[scenario.options.length - 1], true);
    }
  }, [timeLeft, phase, outcome, scenarios, levelIndex, applyChoice]);

  function startGame() {
    setStats(INITIAL_STATS);
    setBudget(INITIAL_BUDGET + LEVEL_INCOME);
    setScore(0);
    setLevelIndex(0);
    setSelectedOption(null);
    setOutcome(null);
    setTimeLeft(LEVEL_SECONDS);
    setScoreSubmitted(false);
    setSubmitError("");
    setPhase("playing");
  }

  function confirmChoice() {
    if (selectedOption === null) return;
    applyChoice(scenarios[levelIndex].options[selectedOption]);
  }

  function goToNextLevel() {
    setOutcome(null);
    if (levelIndex + 1 >= scenarios.length) {
      setPhase("finished");
      loadLeaderboard();
      return;
    }
    setLevelIndex((prev) => prev + 1);
    setBudget((prev) => prev + LEVEL_INCOME);
    setTimeLeft(LEVEL_SECONDS);
  }

  async function submitScore() {
    setSubmitting(true);
    setSubmitError("");
    try {
      await api.submitScore({
        playerName: playerName.trim() || t("game.anonymous"),
        score,
        sustainabilityScore: Math.round(stats.sustainability),
        levelsCompleted: scenarios.length,
      });
      setScoreSubmitted(true);
      loadLeaderboard();
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") return <Loading />;
  if (status === "error") return <ErrorState message={t("common.error")} onRetry={loadScenarios} />;

  const achievements = earnedAchievements(stats, phase === "finished");

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
          <div className="max-w-xl mx-auto space-y-8">
            <div className="card p-8 text-center">
              <p className="text-slate-600 leading-relaxed mb-4">{t("game.intro")}</p>
              <ul className="text-sm text-slate-500 space-y-1 mb-6">
                <li>{t("game.rulesBudget", { start: INITIAL_BUDGET + LEVEL_INCOME, income: LEVEL_INCOME })}</li>
                <li>{t("game.rulesTimer", { seconds: LEVEL_SECONDS })}</li>
              </ul>
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
                className="input mb-6"
              />
              <button type="button" onClick={startGame} className="btn-primary w-full sm:w-auto">
                <Gamepad2 size={18} aria-hidden="true" />
                {t("game.startGame")}
              </button>
            </div>
            <Leaderboard t={t} leaderboard={leaderboard} />
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
            outcome={outcome}
            goToNextLevel={goToNextLevel}
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
            submitting={submitting}
            submitError={submitError}
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
      <div
        className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden"
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={`h-full rounded-full transition-all duration-500 ${colorClass}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function EffectChip({ icon: Icon, label, delta, good }) {
  if (delta === 0) return null;
  const sign = delta > 0 ? "+" : "";
  return (
    <li
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
        good ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon size={16} aria-hidden="true" />
        {label}
      </span>
      <span>
        {sign}
        {delta}
      </span>
    </li>
  );
}

function GameLevel({
  t, scenario, levelIndex, totalLevels, stats, budget, score, timeLeft,
  selectedOption, setSelectedOption, confirmChoice, outcome, goToNextLevel,
}) {
  const progressPercent = Math.round(((levelIndex + (outcome ? 1 : 0)) / totalLevels) * 100);
  const isLast = levelIndex + 1 >= totalLevels;
  const nextButtonRef = useRef(null);

  useEffect(() => {
    if (outcome) nextButtonRef.current?.focus();
  }, [outcome]);

  return (
    <div className="max-w-3xl mx-auto">
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
            <span
              className={`flex items-center gap-1.5 ${timeLeft <= 5 && !outcome ? "text-red-600" : "text-slate-500"}`}
              aria-label={`${t("game.timeLeft")}: ${timeLeft}${t("game.seconds")}`}
            >
              <Clock size={16} aria-hidden="true" />
              {timeLeft}
              {t("game.seconds")}
            </span>
          </div>
        </div>
        <div
          className="h-2 w-full rounded-full bg-slate-100 overflow-hidden"
          role="progressbar"
          aria-label={t("game.level")}
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-sdg7-yellow transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      <div className="card p-5 mb-6 grid gap-4 sm:grid-cols-2">
        {Object.entries(STAT_META).map(([key, meta]) => (
          <StatBar key={key} icon={meta.icon} label={t(meta.labelKey)} value={stats[key]} colorClass={meta.bar} />
        ))}
      </div>

      <div className="card p-7">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{scenario.title}</h2>
        <p className="text-slate-500 leading-relaxed mb-6">{scenario.description}</p>

        {!outcome ? (
          <>
            <p className="font-semibold text-slate-700 mb-3">{t("game.chooseAction")}</p>
            <div className="space-y-3">
              {scenario.options.map((option, i) => {
                const cost = costOf(option);
                const locked = isLocked(option, scenario.options, budget);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedOption(i)}
                    disabled={locked}
                    aria-pressed={selectedOption === i}
                    className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedOption === i
                        ? "border-sdg7-green bg-green-50"
                        : "border-slate-200 hover:border-sdg7-green/50"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-3">
                        {selectedOption === i && <CheckCircle2 className="text-sdg7-green shrink-0" size={20} aria-hidden="true" />}
                        {locked && <Lock className="text-slate-500 shrink-0" size={18} aria-hidden="true" />}
                        <span className="text-slate-700">{option.text}</span>
                      </span>
                      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {cost > 0 ? `${t("game.cost")}: ${cost}` : t("game.free")}
                      </span>
                    </span>
                    {locked && <span className="mt-1 block text-xs text-red-600">{t("game.notEnoughBudget")}</span>}
                  </button>
                );
              })}
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
          </>
        ) : (
          <div aria-live="polite">
            {outcome.timedOut && (
              <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 mb-4 text-sm font-semibold text-amber-700">
                <TimerOff size={16} aria-hidden="true" />
                {t("game.timeUp")}
              </p>
            )}
            <p className="text-sm font-semibold text-slate-500 mb-1">{t("game.yourDecision")}</p>
            <p className="font-bold text-slate-800 mb-4">{outcome.optionText}</p>
            <p className="text-sm font-semibold text-slate-500 mb-2">{t("game.consequences")}</p>
            <ul className="grid gap-2 sm:grid-cols-2 mb-6">
              {Object.entries(STAT_META).map(([key, meta]) => {
                const delta = outcome.effects[key];
                const good = LOWER_IS_BETTER.has(key) ? delta < 0 : delta > 0;
                return <EffectChip key={key} icon={meta.icon} label={t(meta.labelKey)} delta={delta} good={good} />;
              })}
              <EffectChip icon={Coins} label={t("game.budget")} delta={outcome.effects.budget} good={outcome.effects.budget >= 0} />
            </ul>
            <button type="button" ref={nextButtonRef} onClick={goToNextLevel} className="btn-primary w-full sm:w-auto">
              {isLast ? t("game.seeResults") : t("game.nextLevel")}
              <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Leaderboard({ t, leaderboard }) {
  return (
    <div className="card p-6">
      <h3 className="flex items-center gap-2 font-bold text-slate-800 text-lg mb-4">
        <Trophy size={20} className="text-sdg7-yellow" aria-hidden="true" />
        {t("game.leaderboardTitle")}
      </h3>
      {leaderboard.length === 0 ? (
        <p className="text-slate-500 text-sm">{t("game.leaderboardEmpty")}</p>
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
  );
}

function FinishedScreen({ t, stats, score, achievements, leaderboard, scoreSubmitted, submitting, submitError, onSubmit, onRestart }) {
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

        {submitError && (
          <p className="mb-4 text-sm text-red-600" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {!scoreSubmitted ? (
            <button type="button" onClick={onSubmit} disabled={submitting} className="btn-accent disabled:opacity-60">
              <Trophy size={18} aria-hidden="true" />
              {submitting ? t("common.loading") : t("game.submitScore")}
            </button>
          ) : (
            <p className="text-sdg7-green font-semibold flex items-center gap-2" role="status">
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

      <Leaderboard t={t} leaderboard={leaderboard} />
    </div>
  );
}
