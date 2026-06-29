import type { Character } from './character.model';
import type { DungeonTheme } from './dungeon.model';
import type { Bestiary } from '../data/bestiario.data';
import type { DungeonConfig } from '../data/dungeons/shared/dungeon-config.types';

export type CampaignId = string;
export type AdventureId = string;

export interface CampaignTextConfig {
  menuKicker: string;
  menuTitle: string;
  menuEdition: string;
  menuCredit: string;
  newAdventureLabel: string;
  continueLabel: string;
  recordsLabel: string;
  debugLabel: string;
  characterCreationCta: string;
  runStart: string;
  floorLog: string;
  challengeLog: string;
  specialRulePrefix: string;
  defeatTitle: string;
  defeatMessage: string;
  defeatLog: string;
  victoryTitle: string;
  victoryMessage: string;
  victoryLog: string;
  retryLabel: string;
  replayLabel: string;
  mainMenuLabel: string;
  floorProgressTitle: string;
  floorReachedLabel: string;
  currency: string;
}

export interface AdventureConfig {
  id: AdventureId;
  title: string;
  description: string;
  totalFloors: number;
  floors: DungeonTheme[];
  dungeons: Record<number, DungeonConfig>;
}

export interface CampaignConfig {
  id: CampaignId;
  title: string;
  settingName: string;
  systemName: string;
  defaultAdventureId: AdventureId;
  texts: CampaignTextConfig;
  adventures: Record<AdventureId, AdventureConfig>;
  bestiary: Bestiary;
  presetCharacters: Omit<Character, 'id'>[];
}
