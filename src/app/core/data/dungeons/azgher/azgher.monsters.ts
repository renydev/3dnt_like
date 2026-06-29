import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver azgher.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const AZGHER_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('enxame_azgher', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('enxame_azgher', scale)),
  6: (scale) => [spawnMonster('enxame_azgher', scale)],
  10: (scale) => [spawnMonster('lamia', scale)],
  13: (scale) => [spawnMonster('androesfinge', scale, true)],
  15: (scale) => [
    spawnMonster('alkhab', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollAzgherEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['enxame_azgher', 'enxame_azgher', 'enxame_azgher', 'lamia', 'androesfinge'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
