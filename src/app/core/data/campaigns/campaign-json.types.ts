import type { AdventureId, CampaignId, CampaignTextConfig } from '../../models/campaign.model';
import type { Bestiary } from '../bestiario.data';
import type { DungeonTheme } from '../../models/dungeon.model';

export interface CampaignAdventureJson {
  id: AdventureId;
  title: string;
  description: string;
  totalFloors?: number;
  floors: DungeonTheme[];
}

export interface CampaignJson {
  id: CampaignId;
  title: string;
  settingName: string;
  systemName: string;
  defaultAdventureId: AdventureId;
  texts: CampaignTextConfig;
  adventures: Record<AdventureId, CampaignAdventureJson>;
  bestiary?: Bestiary;
}
