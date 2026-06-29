import { campaignFromJson } from '../campaign-json-loader';
import type { CampaignJson } from '../campaign-json.types';
import unipotenciaCampaignJson from './unipotencia.campaign.json';

export const UNIPOTENCIA_CAMPAIGN = campaignFromJson(unipotenciaCampaignJson as CampaignJson);
