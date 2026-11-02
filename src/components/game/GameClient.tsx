"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine, type HudState } from "@/game/engine";
import type { InputAction } from "@/game/input";
import { heroById, HEROES } from "@/game/render/heroes";
import { api } from "@/lib/apiClient";
import { DIFFICULTY_LABELS } from "@/lib/gameRules";
import { MODE_LABELS, THEME_LABELS, type PublicPhase } from "@/lib/types";
import { HeroSelect } from "./HeroSelect";
import { Hud } from "./Hud";
import { QuestionModal } from "./QuestionModal";
import { ResultPanel } from "./ResultPanel";
import { TouchControls } from "./TouchControls";
import styles from "./game.module.css";

type Screen = "intro" | "playing" | "ended";

interface EndState {
  completed: boolean;
  stars: number;
  heartsLeft: number;
}

const MUTE_KEY = "guardioes:muted";

export function GameClient({ phase }: { phase: PublicPhase }) {
  const [screen, setScreen] = useState<Screen>("intro");
  const [heroId, setHeroId] = useState(HEROES[0].id);
  const [runToken, setRunToken] = useState("");
  const [hud, setHud] = useState<HudState | null>(null);
  const [gateIndex, setGateIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; choice: number; correct: boolean }[]>([]);
  const [end, setEnd] = useState<EndState | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");
  const [runId, setRunId] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  useEffect(() => {
    if (screen !== "playing" || !canvasRef.current) return;
    const engine = new GameEngine(
      canvasRef.current,
      {
        seed: `${phase.slug}:${phase.updatedAt}`,
        theme: phase.theme,
        mode: phase.mode,
        difficulty: phase.difficulty,
        hearts: phase.hearts,
        totalSegments: phase.questions.length,
        hero: heroById(heroId),
      },
      {
        onHud: setHud,
        onGate: setGateIndex,
        onEnd: (result) => {
          setEnd(result);
          setScreen("ended");
        },
        onPauseRequest: () => setIsPaused((p) => !p),
      },
    );
    engine.audio.setMuted(localStorageMuted());
    engineRef.current = engine;
    engine.start();
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [screen, runId, phase, heroId]);

  useEffect(() => {
    engineRef.current?.setPaused(isPaused);
  }, [isPaused]);

  const startGame = async () => {
    setIsStarting(true);
    setError("");
    try {
      const data = await api<{ runToken: string }>(`/api/phases/${phase.slug}/run`, { method: "POST" });
      setRunToken(data.runToken);
      setIsTouch(window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 0);
      setIsMuted(localStorageMuted());
      setAnswers([]);
      setEnd(null);
      setGateIndex(null);
      setIsPaused(false);
      setRunId((n) => n + 1);
      setScreen("playing");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível iniciar.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswered = (choice: number, correct: boolean) => {
    if (gateIndex === null) return;
    const question = phase.questions[gateIndex];
    setAnswers((prev) => [...prev, { questionId: question.id, choice, correct }]);
    setGateIndex(null);
    engineRef.current?.resolveGate(correct);
  };

  const handleTouch = useCallback((action: InputAction, pressed: boolean) => {
    engineRef.current?.input.setTouch(action, pressed);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    engineRef.current?.audio.setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      // Not critical.
    }
  };

  const toggleFullscreen = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void stage.requestFullscreen?.().catch(() => undefined);
  };

  const hero = heroById(heroId);

  if (screen === "intro") {
    return (
      <section className={styles.intro}>
        <div className={styles.introHead}>
          <p className={styles.kicker}>{THEME_LABELS[phase.theme]}</p>
          <h1 className={styles.introTitle}>{phase.title}</h1>
          {phase.description && <p className={styles.introText}>{phase.description}</p>}
          <ul className={styles.tags}>
            <li>{phase.questions.length} desafios</li>
            <li>{MODE_LABELS[phase.mode].split(" (")[0]}</li>
            <li>{DIFFICULTY_LABELS[phase.difficulty]}</li>
            <li>{"♥".repeat(phase.hearts)}</li>
          </ul>
        </div>
        <h2 className={styles.sectionTitle}>Quem vai na aventura?</h2>
        <HeroSelect selected={heroId} onSelect={setHeroId} />
        <div className={styles.howTo}>
          <div>
            <b>Correr e pular</b>
            <span>← → ou A D para andar · Espaço, ↑ ou W para pular · pule em cima dos inimigos!</span>
          </div>
          <div>
            <b>Voar</b>
            <span>↑ ↓ ← → ou W A S D para desviar · o caminho segue sozinho</span>
          </div>
          <div>
            <b>Portal ?</b>
            <span>Cada portal traz uma pergunta. Errou? Perde um coração. ★ valem pontos extras.</span>
          </div>
          <div>
            <b>Poder da leitura ✦</b>
            <span>X ou J lança uma letra mágica de curto alcance. A energia é pouca: recarrega com ★ e com respostas certas. Alguns obstáculos são imunes!</span>
          </div>
        </div>
        {error && (
          <p className={styles.errorText} role="alert">
            {error}
          </p>
        )}
        <div className={styles.introActions}>
          <button type="button" className="btn btn-primary btn-lg" onClick={() => void startGame()} disabled={isStarting}>
            {isStarting ? "Preparando…" : `Começar com ${hero.name} →`}
          </button>
          <Link href={`/fase/${phase.slug}/ranking`} className="btn btn-ghost">
            Ranking desta fase
          </Link>
        </div>
      </section>
    );
  }

  const gateQuestion = gateIndex !== null ? phase.questions[gateIndex] : null;
  const correctCount = answers.filter((a) => a.correct).length;

  return (
    <section className={styles.play}>
      <div ref={stageRef} className={styles.playArea}>
      <div className={styles.stage}>
        <div className={styles.canvasBox}>
          <canvas ref={canvasRef} className={styles.canvas} aria-label={`Jogo: ${phase.title}`} />
        </div>
        {hud && (
          <Hud hud={hud} heroName={hero.name} isMuted={isMuted} onToggleMute={toggleMute} onPause={() => setIsPaused(true)} onFullscreen={toggleFullscreen} />
        )}
        {isPaused && screen === "playing" && (
          <div className={styles.modalBackdrop}>
            <div className={styles.pauseCard} role="dialog" aria-modal="true" aria-label="Jogo pausado">
              <h2>Pausado</h2>
              <button type="button" className="btn btn-primary" onClick={() => setIsPaused(false)} autoFocus>
                Continuar
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setScreen("intro")}>
                Sair para o início
              </button>
            </div>
          </div>
        )}
        {gateQuestion && gateIndex !== null && (
          <QuestionModal
            key={gateQuestion.id}
            slug={phase.slug}
            runToken={runToken}
            question={gateQuestion}
            index={gateIndex}
            total={phase.questions.length}
            onDone={handleAnswered}
          />
        )}
        {screen === "ended" && end && (
          <ResultPanel
            slug={phase.slug}
            runToken={runToken}
            heroId={heroId}
            completed={end.completed}
            stars={end.stars}
            heartsLeft={end.heartsLeft}
            answers={answers.map(({ questionId, choice }) => ({ questionId, choice }))}
            correctCount={correctCount}
            total={phase.questions.length}
            onPlayAgain={() => void startGame()}
          />
        )}
      </div>
      {isTouch && screen === "playing" && gateQuestion === null && !isPaused && <TouchControls flight={hud?.flight ?? false} onInput={handleTouch} />}
      </div>
      {isTouch && <p className={styles.rotateHint}>Controles na tela ativos: use os botões grandes para correr, pular e voar.</p>}
      <p className={styles.footHint}>Dica: aperte <kbd>H</kbd> para ver as hitboxes · <kbd>P</kbd> pausa</p>
    </section>
  );
}

function localStorageMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
