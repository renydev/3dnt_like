import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver valkaria.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const VALKARIA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('bhaltan', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('bhaltan', scale)),
  6: (scale) => [spawnMonster('bhaltan', scale)],
  10: (scale) => [spawnMonster('bhaltan', scale)],
  13: (scale) => [spawnMonster('bhaltan', scale, true)],
  15: (scale) => [
    spawnMonster('avatar_valkaria', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollValkariaEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['bhaltan', 'bhaltan', 'bhaltan', 'bhaltan', 'bhaltan'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
