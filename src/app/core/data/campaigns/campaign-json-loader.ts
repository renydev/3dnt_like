import { PRESET_CHARACTERS } from '../../models/character.model';
import type { AdventureConfig, CampaignConfig } from '../../models/campaign.model';
import type { DungeonConfig } from '../dungeons/shared/dungeon-config.types';
import type { CampaignJson } from './campaign-json.types';

export interface CampaignJsonRuntimeOptions {
  dungeons?: Record<number, DungeonConfig>;
}

export function campaignFromJson(
  json: CampaignJson,
  options: CampaignJsonRuntimeOptions = {},
): CampaignConfig {
  const adventures = Object.fromEntries(
    Object.entries(json.adventures).map(([id, adventure]) => {
      const config: AdventureConfig = {
        ...adventure,
        totalFloors: adventure.totalFloors ?? adventure.floors.length,
        dungeons: options.dungeons ?? {},
      };
      return [id, config];
    }),
  );

  return {
    ...json,
    adventures,
    bestiary: json.bestiary ?? {},
    presetCharacters: PRESET_CHARACTERS,
  };
}
