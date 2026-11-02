export type HairStyle = "curly" | "ponytail" | "short" | "bun" | "spiky";
export type Accessory = "scarf" | "cap" | "glasses" | "headband" | "backpack";

export interface Hero {
  id: string;
  name: string;
  title: string;
  skin: string;
  eyes: string;
  hair: string;
  hairStyle: HairStyle;
  shirt: string;
  pants: string;
  shoes: string;
  accent: string;
  accessory: Accessory;
}

export const HEROES: Hero[] = [
  {
    id: "iara",
    name: "Iara",
    title: "Caçadora de pistas",
    skin: "#c98b5e",
    eyes: "#7a4a2a",
    hair: "#2b1a12",
    hairStyle: "curly",
    shirt: "#ff7a45",
    pants: "#3b4a8c",
    shoes: "#ffffff",
    accent: "#ffd23f",
    accessory: "headband",
  },
  {
    id: "kaua",
    name: "Kauã",
    title: "Corredor destemido",
    skin: "#a8673f",
    eyes: "#4a3020",
    hair: "#151012",
    hairStyle: "spiky",
    shirt: "#2bb673",
    pants: "#22324f",
    shoes: "#ff4d4d",
    accent: "#ffe066",
    accessory: "scarf",
  },
  {
    id: "luna",
    name: "Luna",
    title: "Mestra das palavras",
    skin: "#f1c7a1",
    eyes: "#7c3aed",
    hair: "#7b3fa0",
    hairStyle: "ponytail",
    shirt: "#5b6cff",
    pants: "#2d2a4a",
    shoes: "#ffd23f",
    accent: "#ff8fd8",
    accessory: "glasses",
  },
  {
    id: "theo",
    name: "Theo",
    title: "Guardião das histórias",
    skin: "#e8b48a",
    eyes: "#2f855a",
    hair: "#c46a2b",
    hairStyle: "short",
    shirt: "#e63e6d",
    pants: "#334155",
    shoes: "#38bdf8",
    accent: "#fef08a",
    accessory: "cap",
  },
  {
    id: "zoe",
    name: "Zoe",
    title: "Exploradora veloz",
    skin: "#8d5a3b",
    eyes: "#b45309",
    hair: "#1f1b2e",
    hairStyle: "bun",
    shirt: "#14b8a6",
    pants: "#5b21b6",
    shoes: "#f97316",
    accent: "#fde047",
    accessory: "backpack",
  },
];

export function heroById(id: string): Hero {
  return HEROES.find((h) => h.id === id) ?? HEROES[0];
}
