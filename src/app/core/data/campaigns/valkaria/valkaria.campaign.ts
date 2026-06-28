import { DUNGEON_REGISTRY } from '../../dungeons/dungeon-registry';
import { campaignFromJson } from '../campaign-json-loader';
import type { CampaignJson } from '../campaign-json.types';
import valkariaCampaignJson from './valkaria.campaign.json';

export const VALKARIA_CAMPAIGN = campaignFromJson(
  valkariaCampaignJson as CampaignJson,
  { dungeons: DUNGEON_REGISTRY },
);
