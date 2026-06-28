import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Losango compacto (1-2-3-4-3-2-1) — ver megalokk.config.ts e o relatório de
// balanceamento (debug panel) para o veredito de cada monstro.
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const MEGALOKK_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('monstro_ferrugem_grande', scale)],
  3: (scale) => Array.from({ length: Math.max(1, d(6) - 4) }, () => spawnMonster('monstro_ferrugem_grande', scale)),
  6: (scale) => [spawnMonster('otyugh_enorme', scale)],
  10: (scale) => [spawnMonster('cubo_gelatinoso_imenso', scale)],
  13: (scale) => [spawnMonster('behir_imenso', scale, true)],
  15: (scale) => [
    spawnMonster('trex_colossal', scale, true),
  ],
};

// Encontro aleatório genérico — sorteia entre os monstros já cadastrados neste andar.
export function rollMegalokkEncounter(scale: GrowthScale): Enemy[] {
  const pool = ['monstro_ferrugem_grande', 'monstro_ferrugem_grande', 'otyugh_enorme', 'cubo_gelatinoso_imenso', 'behir_imenso'];
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const count = Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster(pick, scale));
}
