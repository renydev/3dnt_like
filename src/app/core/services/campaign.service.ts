import { Injectable, computed, signal } from '@angular/core';
import { CAMPAIGN_REGISTRY, DEFAULT_CAMPAIGN_ID } from '../data/campaigns/campaign-registry';
import type { AdventureConfig, CampaignConfig, CampaignId } from '../models/campaign.model';
import type { DungeonTheme } from '../models/dungeon.model';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  activeCampaignId = signal<CampaignId>(DEFAULT_CAMPAIGN_ID);
  activeAdventureId = signal<string | null>(null);

  activeCampaign = computed<CampaignConfig>(() => CAMPAIGN_REGISTRY[this.activeCampaignId()]);

  activeAdventure = computed<AdventureConfig>(() => {
    const campaign = this.activeCampaign();
    const adventureId = this.activeAdventureId() ?? campaign.defaultAdventureId;
    return campaign.adventures[adventureId] ?? campaign.adventures[campaign.defaultAdventureId];
  });

  totalFloors = computed(() => this.activeAdventure().totalFloors);
  floors = computed(() => this.activeAdventure().floors);
  bestiary = computed(() => this.activeCampaign().bestiary);

  setCampaign(campaignId: CampaignId, adventureId?: string): void {
    const campaign = CAMPAIGN_REGISTRY[campaignId] ?? CAMPAIGN_REGISTRY[DEFAULT_CAMPAIGN_ID];
    this.activeCampaignId.set(campaign.id);
    this.activeAdventureId.set(adventureId ?? campaign.defaultAdventureId);
  }

  getTheme(floorNumber: number): DungeonTheme {
    const floors = this.floors();
    return floors[Math.min(Math.max(floorNumber, 1) - 1, floors.length - 1)];
  }

  getNextTheme(floorNumber: number): DungeonTheme | null {
    const floors = this.floors();
    return floors[Math.min(floorNumber, floors.length - 1)] ?? null;
  }

  getDungeonConfig(floorNumber: number) {
    return this.activeAdventure().dungeons[floorNumber] ?? null;
  }

  getBestiaryEntry(monsterId: string) {
    return this.bestiary()[monsterId] ?? null;
  }

  format(template: string, values: Record<string, string | number | null | undefined>): string {
    return template.replace(/\{(\w+)\}/g, (_, key: string) => `${values[key] ?? ''}`);
  }

  floorText(template: string, floorNumber: number): string {
    const theme = this.getTheme(floorNumber);
    return this.format(template, {
      floor: floorNumber,
      totalFloors: this.totalFloors(),
      floorName: theme.name,
      patron: theme.godName,
      domain: theme.godDomain,
      guardian: theme.guardianName,
      setting: this.activeCampaign().settingName,
    });
  }
}
