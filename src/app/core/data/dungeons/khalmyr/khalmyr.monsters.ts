import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver khalmyr.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const KHALMYR_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('clerigo_khalmyr_ferido', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('clerigo_khalmyr_ferido', scale)),
  6: (scale) => [spawnMonster('clerigo_khalmyr_ferido', scale)],
  10: (scale) => [spawnMonster('paladino_anao_khalmyr', scale)],
  13: (scale) => [spawnMonster('zumbi_grande_khalmyr', scale, true)],
  15: (scale) => [
    spawnMonster('thomar_steelwill', scale, true),
    spawnMonster('karlya', scale, false),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollKhalmyrEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['clerigo_khalmyr_ferido', 'clerigo_khalmyr_ferido', 'clerigo_khalmyr_ferido', 'paladino_anao_khalmyr', 'zumbi_grande_khalmyr'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
