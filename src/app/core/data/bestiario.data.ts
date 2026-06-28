import { Enemy } from '../models/combat.model';
import { GrowthScale } from '../utils/pp-calculator';
import { GrowableMonsterTemplate, spawnGrowableMonster } from './dungeons/shared/monster-growth';
import valkariaCampaignJson from './campaigns/valkaria/valkaria.campaign.json';

// Bestiarios sao dados de campanha. Este arquivo mantem apenas os tipos e helpers
// de instancia para os encontros autorais de Valkaria e futuras campanhas via JSON/API.

export type MonsterTemplate = GrowableMonsterTemplate;
export type Bestiary = Record<string, MonsterTemplate>;

export const BESTIARIO = valkariaCampaignJson.bestiary as Bestiary;

/** Todos os IDs cadastrados no bestiário — usado pelo encontro caótico de Nimb. */
export const ALL_MONSTER_IDS = Object.keys(BESTIARIO);

/** Instancia um Enemy a partir de um template do bestiário, já escalado pelo confronto atual. */
export function spawnMonsterFromBestiary(bestiary: Bestiary, key: string, scale: GrowthScale, isBoss = false): Enemy {
  const template = bestiary[key];
  if (!template) {
    throw new Error(`Monster not found in campaign bestiary: ${key}`);
  }
  return spawnGrowableMonster(template, key, isBoss, scale);
}

/** Compatibilidade para as masmorras autorais de Valkaria, cujo bestiário vem do JSON da campanha. */
export function spawnMonster(key: string, scale: GrowthScale, isBoss = false): Enemy {
  return spawnMonsterFromBestiary(BESTIARIO, key, scale, isBoss);
}

/** Todos os monstros cadastrados para um andar específico — útil para auditoria/debug. */
export function monstersForFloor(floor: number): Array<{ id: string } & MonsterTemplate> {
  return Object.entries(BESTIARIO)
    .filter(([, tpl]) => tpl.floor === floor)
    .map(([id, tpl]) => ({ id, ...tpl }));
}
