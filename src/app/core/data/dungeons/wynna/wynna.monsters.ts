import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Losango compacto (1-2-3-4-3-2-1) — ver wynna.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const WYNNA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('feiticeiro_wynna', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('ninfa_wynna', scale)),
  6: (scale) => [spawnMonster('elemental_wynna', scale)],
  10: (scale) => [spawnMonster('djinn_enorme', scale)],
  13: (scale) => [spawnMonster('hidra_branca', scale, true)],
  15: (scale) => [
    spawnMonster('darkazimm', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollWynnaEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['feiticeiro_wynna', 'ninfa_wynna', 'elemental_wynna', 'djinn_enorme', 'hidra_branca'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
