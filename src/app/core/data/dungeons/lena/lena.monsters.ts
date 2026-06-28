import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver lena.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const LENA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('formian_guerreiro', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('lobo_enorme', scale)),
  6: (scale) => [spawnMonster('dinonico_enorme', scale)],
  10: (scale) => [spawnMonster('lagarto_gigante', scale)],
  13: (scale) => [spawnMonster('quelicerossauro', scale, true)],
  15: (scale) => [
    spawnMonster('tandan', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollLenaEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['formian_guerreiro', 'lobo_enorme', 'dinonico_enorme', 'lagarto_gigante', 'quelicerossauro'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
