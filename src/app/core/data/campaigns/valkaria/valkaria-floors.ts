import type { CampaignJson } from '../campaign-json.types';
import valkariaCampaignJson from './valkaria.campaign.json';

const campaignJson = valkariaCampaignJson as CampaignJson;

export const VALKARIA_FLOORS = campaignJson.adventures['libertacao-de-valkaria'].floors;
