import { CAMPAIGN_REGISTRY } from './campaign-registry';
import { validateCampaignRegistry } from './campaign-validation';

describe('campaign registry', () => {
  it('contains valid campaign packs', () => {
    const issues = validateCampaignRegistry(CAMPAIGN_REGISTRY);
    expect(issues).toEqual([]);
  });
});
