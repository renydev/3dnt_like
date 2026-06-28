import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Losango compacto (1-2-3-4-3-2-1) — ver nimb.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const NIMB_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('fera_caos', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('fera_caos', scale)),
  6: (scale) => [spawnMonster('fera_caos', scale)],
  10: (scale) => [spawnMonster('tarrasque', scale)],
  13: (scale) => [spawnMonster('tarrasque', scale, true)],
  15: (scale) => [
    spawnMonster('hit', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollNimbEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['fera_caos', 'fera_caos', 'fera_caos', 'tarrasque', 'tarrasque'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
