"use client";

import { HEROES } from "@/game/render/heroes";
import { HeroPortrait } from "./HeroPortrait";
import styles from "./game.module.css";

type Props = {
  selected: string;
  onSelect: (id: string) => void;
};

export function HeroSelect({ selected, onSelect }: Props) {
  return (
    <div className={styles.heroGrid} role="radiogroup" aria-label="Escolha seu herói">
      {HEROES.map((hero) => {
        const isActive = hero.id === selected;
        return (
          <button
            key={hero.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={isActive ? `${styles.heroCard} ${styles.heroCardActive}` : styles.heroCard}
            style={{ ["--hero-color" as string]: hero.tunic }}
            onClick={() => onSelect(hero.id)}
          >
            <HeroPortrait hero={hero} size={104} animate={isActive} state={isActive ? "run" : "idle"} />
            <span className={styles.heroName}>{hero.name}</span>
            <span className={styles.heroTitle}>{hero.title}</span>
          </button>
        );
      })}
    </div>
  );
}
