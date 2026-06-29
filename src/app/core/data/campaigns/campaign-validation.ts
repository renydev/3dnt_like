import type { CampaignConfig } from '../../models/campaign.model';

export interface CampaignValidationIssue {
  campaignId: string;
  message: string;
}

export function validateCampaign(campaign: CampaignConfig): CampaignValidationIssue[] {
  const issues: CampaignValidationIssue[] = [];
  const adventure = campaign.adventures[campaign.defaultAdventureId];

  if (!adventure) {
    issues.push({ campaignId: campaign.id, message: `Default adventure not found: ${campaign.defaultAdventureId}` });
    return issues;
  }

  if (adventure.totalFloors !== adventure.floors.length) {
    issues.push({
      campaignId: campaign.id,
      message: `Adventure ${adventure.id} declares ${adventure.totalFloors} floors but has ${adventure.floors.length}`,
    });
  }

  if (!Object.keys(campaign.bestiary).length) {
    issues.push({ campaignId: campaign.id, message: 'Campaign has no bestiary entries' });
  }

  const ids = new Set<string>();
  for (const floor of adventure.floors) {
    if (ids.has(floor.id)) {
      issues.push({ campaignId: campaign.id, message: `Duplicated floor id: ${floor.id}` });
    }
    ids.add(floor.id);

    if (!floor.name || !floor.guardianName || !floor.challengeType) {
      issues.push({ campaignId: campaign.id, message: `Incomplete floor config: ${floor.id}` });
    }

    if (!floor.monsterTypes.length || !floor.trapTypes.length || !floor.treasureTypes.length) {
      issues.push({ campaignId: campaign.id, message: `Floor ${floor.id} is missing encounter content` });
    }
  }

  for (const [monsterId, monster] of Object.entries(campaign.bestiary)) {
    if (!monster.name || !monster.archetype || monster.floor < 1) {
      issues.push({ campaignId: campaign.id, message: `Incomplete bestiary entry: ${monsterId}` });
    }
  }

  return issues;
}

export function validateCampaignRegistry(registry: Record<string, CampaignConfig>): CampaignValidationIssue[] {
  return Object.values(registry).flatMap(validateCampaign);
}
