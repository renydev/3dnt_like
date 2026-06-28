import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver tanna-toh.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const TANNA_TOH_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('liranny', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('liranny', scale)),
  6: (scale) => [spawnMonster('liranny', scale)],
  10: (scale) => [spawnMonster('thwor_ironfist', scale)],
  13: (scale) => [spawnMonster('thwor_ironfist', scale, true)],
  15: (scale) => [
    spawnMonster('sathane', scale, true),
  ],
};
