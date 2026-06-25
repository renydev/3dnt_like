import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Megalokk — convertido de "A Libertação de Valkaria" (pág. 98-101).

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme megalokk.config.ts layout:
//  1 = Câmara do Dragão Ancião          (monster) — behir, inimigo mortal de dragões
//  4 = Câmara da Hidra de Doze Cabeças  (monster)
//  5 = Câmara do Gigante                (monster)
//  7 = Câmara da Rocha Viva             (monster) — umber hulk
//  8 = Câmara do Tiranossauro Colossal  (boss)
export const MEGALOKK_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnMonster('behir_imenso', scale)],
  4: (scale) => [spawnMonster('hidra_negra', scale)],
  5: (scale) => [spawnMonster('troll_guerra', scale)],
  7: (scale) => [spawnMonster('umber_hulk_enorme', scale)],
  8: (scale) => [spawnMonster('trex_colossal', scale, true)],
};

// ── Encontros aleatórios — predadores selvagens, todos maiores que o normal ──
// Roll 4-24: 4-6=otyugh, 7-8=behir, 9-10=bulette, 11-12=cubo gelatinoso, 13-14=tendrículo,
//            15-16=umber hulk, 17-18=trolls gigantes, 19-20=monstros da ferrugem,
//            21-22=formians guerreiros, 23-24=T-rex colossal
export function rollMegalokkEncounter(scale: number): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 6) return [spawnMonster('otyugh_enorme', scale)];
  if (roll <= 8) return [spawnMonster('behir_imenso', scale)];
  if (roll <= 10) return [spawnMonster('bulette_imenso', scale)];
  if (roll <= 12) return [spawnMonster('cubo_gelatinoso_imenso', scale)];
  if (roll <= 14) return [spawnMonster('tendriculo_imenso', scale)];
  if (roll <= 16) return [spawnMonster('umber_hulk_enorme', scale)];
  if (roll <= 18) return Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('troll_guerra', scale));
  if (roll <= 20) return Array.from({ length: d(6) }, () => spawnMonster('monstro_ferrugem_grande', scale));
  if (roll <= 22) return Array.from({ length: d(6) + 1 }, () => spawnMonster('formian_guerreiro', scale));
  // 23-24: T-rex colossal
  return [spawnMonster('trex_colossal', scale)];
}
