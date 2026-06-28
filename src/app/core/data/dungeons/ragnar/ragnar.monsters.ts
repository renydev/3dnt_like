import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Losango compacto (1-2-3-4-3-2-1) — ver ragnar.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const RAGNAR_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('goblin_guerreiro', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('goblin_guerreiro', scale)),
  6: (scale) => [spawnMonster('orc_berserker', scale)],
  10: (scale) => [spawnMonster('orc_guerreiro', scale)],
  13: (scale) => [spawnMonster('troll_guerra', scale, true)],
  15: (scale) => [
    spawnMonster('gromthar', scale, true),
    spawnMonster('ogre_batalha', scale, false),
    spawnMonster('hobgoblin_capitao', scale, false),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollRagnarEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['goblin_guerreiro', 'goblin_guerreiro', 'orc_berserker', 'orc_guerreiro', 'troll_guerra'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
