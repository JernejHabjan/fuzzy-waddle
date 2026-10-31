import { FactionType } from "./faction-type";

export function getRandomFactionType(): FactionType {
  const enumValues = Object.values(FactionType).filter((value) => typeof value === "number");
  const randomIndex = Math.floor(Math.random() * enumValues.length);
  return enumValues[randomIndex] as FactionType;
}
