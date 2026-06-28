import type { CampaignId } from './campaign.model';
import type { Character } from './character.model';
import type { DungeonFloor } from './dungeon.model';

export interface SaveGameData {
  version: 1;
  savedAt: string;
  campaignId: CampaignId;
  adventureId: string | null;
  screen: 'dungeon' | 'encounter' | 'merchant' | 'floor_transition';
  character: Character;
  companions: Character[];
  floorNumber: number;
  currentFloor: DungeonFloor;
  currentRoomId: number;
  narrativeFlags: Record<string, string | number | boolean>;
}
