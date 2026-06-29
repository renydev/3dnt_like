import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver sszzaas.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const SSZZAAS_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('naga_sszzaas', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('naga_sszzaas', scale)),
  6: (scale) => [spawnMonster('naga_sszzaas', scale)],
  10: (scale) => [spawnMonster('medusa_sszzaas', scale)],
  13: (scale) => [spawnMonster('cultista_sszzaas', scale, true)],
  15: (scale) => [
    spawnMonster('dragao_negro_adulto', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollSszzaasEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['naga_sszzaas', 'naga_sszzaas', 'naga_sszzaas', 'medusa_sszzaas', 'cultista_sszzaas'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
