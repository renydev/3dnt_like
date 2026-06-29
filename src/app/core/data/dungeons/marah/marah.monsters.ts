import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vem do bestiario da campanha Valkaria via JSON.
// Losango compacto (1-2-3-4-3-2-1) — ver marah.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const MARAH_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('driade_marah', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('sprite_feiticeiro_marah', scale)),
  6: (scale) => [spawnMonster('bardo_marah', scale)],
  7: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('driade_marah', scale)),
  10: (scale) => [spawnMonster('estatua_viva', scale)],
  13: (scale) => [spawnMonster('paladino_marah', scale, true)],
  15: (scale) => [
    spawnMonster('prislanya', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollMarahEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['driade_marah', 'sprite_feiticeiro_marah', 'bardo_marah', 'estatua_viva', 'paladino_marah'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
