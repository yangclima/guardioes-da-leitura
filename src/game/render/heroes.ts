export type HairStyle = "curly" | "ponytail" | "short" | "bun" | "spiky";
export type Headgear = "hood" | "nasal" | "feather" | "kettle" | "leather";
export type Weapon = "dagger" | "sword" | "staff" | "spear" | "axe";

/** A chibi adventurer, painted in an earthy storybook palette. */
export interface Hero {
  id: string;
  name: string;
  title: string;
  skin: string;
  eyes: string;
  hair: string;
  hairStyle: HairStyle;
  /** Main garment; also the hero's card color. */
  tunic: string;
  trousers: string;
  /** Boots, belt, bracers and straps. */
  leather: string;
  /** Base color of the hat, hood or helmet. */
  hat: string;
  /** Trim, shield paint and magic glow. */
  accent: string;
  headgear: Headgear;
  weapon: Weapon;
  shield: boolean;
  pack: boolean;
  glasses: boolean;
}

export const HEROES: Hero[] = [
  {
    id: "iara",
    name: "Iara",
    title: "Caçadora de pistas",
    skin: "#c98b5e",
    eyes: "#5a3520",
    hair: "#2b1a12",
    hairStyle: "curly",
    tunic: "#7a6a3c",
    trousers: "#5a4632",
    leather: "#7a4a2a",
    hat: "#55703a",
    accent: "#d9a441",
    headgear: "hood",
    weapon: "dagger",
    shield: false,
    pack: false,
    glasses: false,
  },
  {
    id: "kaua",
    name: "Kauã",
    title: "Corredor destemido",
    skin: "#a8673f",
    eyes: "#3a2418",
    hair: "#1d1410",
    hairStyle: "spiky",
    tunic: "#9c4a2e",
    trousers: "#4a3b2c",
    leather: "#6b4226",
    hat: "#9aa3ab",
    accent: "#c9a24a",
    headgear: "nasal",
    weapon: "sword",
    shield: true,
    pack: false,
    glasses: false,
  },
  {
    id: "luna",
    name: "Luna",
    title: "Mestra das palavras",
    skin: "#f1c7a1",
    eyes: "#4c2a6a",
    hair: "#6d3f86",
    hairStyle: "ponytail",
    tunic: "#4f5d7a",
    trousers: "#3b3a4a",
    leather: "#7a5233",
    hat: "#4b6b3f",
    accent: "#e9c46a",
    headgear: "feather",
    weapon: "staff",
    shield: false,
    pack: false,
    glasses: true,
  },
  {
    id: "theo",
    name: "Theo",
    title: "Guardião das histórias",
    skin: "#e8b48a",
    eyes: "#2f5a3a",
    hair: "#b8642a",
    hairStyle: "short",
    tunic: "#6f7a45",
    trousers: "#5b4a35",
    leather: "#6e4529",
    hat: "#5f7a3a",
    accent: "#b5562f",
    headgear: "kettle",
    weapon: "spear",
    shield: true,
    pack: false,
    glasses: false,
  },
  {
    id: "zoe",
    name: "Zoe",
    title: "Exploradora veloz",
    skin: "#8d5a3b",
    eyes: "#3a2214",
    hair: "#1f1b22",
    hairStyle: "bun",
    tunic: "#3f6f6a",
    trousers: "#544233",
    leather: "#7d4f2c",
    hat: "#8a5a34",
    accent: "#d08a3a",
    headgear: "leather",
    weapon: "axe",
    shield: false,
    pack: true,
    glasses: false,
  },
];

export function heroById(id: string): Hero {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}
