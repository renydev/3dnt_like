import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver thyatis.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const THYATIS_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('elemental_fogo_anciao', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('elemental_fogo_anciao', scale)),
  6: (scale) => [spawnMonster('elemental_fogo_anciao', scale)],
  10: (scale) => [spawnMonster('mastim_thyatis', scale)],
  13: (scale) => [spawnMonster('thoqqa', scale, true)],
  15: (scale) => [
    spawnMonster('reyjane', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollThyatisEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['elemental_fogo_anciao', 'elemental_fogo_anciao', 'elemental_fogo_anciao', 'mastim_thyatis', 'thoqqa'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
