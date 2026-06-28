import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Losango compacto (1-2-3-4-3-2-1) — ver oceano.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const OCEANO_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('homem_selako', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('sereia_feiticeira', scale)),
  6: (scale) => [spawnMonster('elfo_mar_ranger', scale)],
  10: (scale) => [spawnMonster('elfo_mar_barbaro', scale)],
  13: (scale) => [spawnMonster('tojanida_imensa', scale, true)],
  15: (scale) => [
    spawnMonster('coriphena', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollOceanoEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['homem_selako', 'sereia_feiticeira', 'elfo_mar_ranger', 'elfo_mar_barbaro', 'tojanida_imensa'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
