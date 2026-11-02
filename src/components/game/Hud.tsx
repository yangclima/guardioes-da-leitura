import type { HudState } from "@/game/engine";
import styles from "./game.module.css";

type Props = {
  hud: HudState;
  heroName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onFullscreen: () => void;
};

export function Hud({ hud, heroName, isMuted, onToggleMute, onPause, onFullscreen }: Props) {
  const hearts = Array.from({ length: hud.maxHearts }, (_, i) => i < hud.hearts);
  const canFullscreen = document.fullscreenEnabled;
  return (
    <div className={styles.hud}>
      <div className={styles.hudLeft}>
        <span className={styles.hudChip} aria-label={`${hud.hearts} de ${hud.maxHearts} corações`}>
          {hearts.map((full, i) => (
            <span key={i} className={full ? styles.heart : styles.heartEmpty} aria-hidden="true">
              ♥
            </span>
          ))}
        </span>
        <span className={styles.hudChip} aria-label={`${hud.stars} estrelas`}>
          <span className={styles.starIcon} aria-hidden="true">★</span> {hud.stars}
        </span>
        <span className={styles.hudChip} aria-label={`Energia do poder: ${hud.energy} de ${hud.maxEnergy}`} title="Energia do poder (X ou J). Recarrega com estrelas e respostas certas.">
          {Array.from({ length: hud.maxEnergy }, (_, i) => (
            <span key={i} className={i < hud.energy ? styles.energy : styles.energyEmpty} aria-hidden="true">
              ✦
            </span>
          ))}
        </span>
      </div>
      <span className={`${styles.hudChip} ${styles.hudCenter}`}>
        {heroName} · Desafio {hud.segment}/{hud.total}
      </span>
      <div className={styles.hudRight}>
        <button type="button" className={styles.hudButton} onClick={onToggleMute} aria-label={isMuted ? "Ligar som" : "Desligar som"}>
          {isMuted ? "🔇" : "🔊"}
        </button>
        {canFullscreen && (
          <button type="button" className={styles.hudButton} onClick={onFullscreen} aria-label="Tela cheia">
            ⛶
          </button>
        )}
        <button type="button" className={styles.hudButton} onClick={onPause} aria-label="Pausar">
          ❚❚
        </button>
      </div>
    </div>
  );
}
