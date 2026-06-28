import type { CampaignJson } from '../campaign-json.types';
import unipotenciaCampaignJson from './unipotencia.campaign.json';

const campaignJson = unipotenciaCampaignJson as CampaignJson;

export const UNIPOTENCIA_FLOORS = campaignJson.adventures['eixo-da-historia-unica'].floors;
