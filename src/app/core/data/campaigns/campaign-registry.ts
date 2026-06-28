import type { CampaignConfig, CampaignId } from '../../models/campaign.model';
import { UNIPOTENCIA_CAMPAIGN } from './unipotencia/unipotencia.campaign';
import { VALKARIA_CAMPAIGN } from './valkaria/valkaria.campaign';

export const DEFAULT_CAMPAIGN_ID: CampaignId = 'valkaria';

export const CAMPAIGN_REGISTRY: Record<CampaignId, CampaignConfig> = {
  valkaria: VALKARIA_CAMPAIGN,
  unipotencia: UNIPOTENCIA_CAMPAIGN,
};
