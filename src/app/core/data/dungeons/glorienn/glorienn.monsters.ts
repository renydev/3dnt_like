import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Losango compacto (1-2-3-4-3-2-1) — ver glorienn.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const GLORIENN_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('cacador_glorienn', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('arqueiro_elfo', scale)),
  6: (scale) => [spawnMonster('arqueiro_glorienn', scale)],
  10: (scale) => [spawnMonster('arqueiro_glorienn', scale)],
  13: (scale) => [spawnMonster('arqueiro_glorienn', scale, true)],
  15: (scale) => [
    spawnMonster('sharindhallenrannas', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollGloriennEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['cacador_glorienn', 'arqueiro_elfo', 'arqueiro_glorienn', 'arqueiro_glorienn', 'arqueiro_glorienn'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
