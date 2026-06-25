import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para o Oceano — convertido de "A Libertação de Valkaria" (pág. 80-85).

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme oceano.config.ts layout:
//  2 = Câmara dos Sahuagins (monster)
//  4 = Câmara dos Polvos    (monster) — usa tojanida como criatura aquática substituta
//  7 = Câmara dos Tubarões  (monster) — tartarugas-dragão
//  8 = Abismo do Kraken (boss) — Coriphena, o dragão-marinho
export const OCEANO_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  2: (scale) => {
    const count = d(6) + d(6) + 6;
    return Array.from({ length: Math.min(count, 5) }, () => spawnMonster('homem_selako', scale));
  },
  4: (scale) => [spawnMonster('tojanida_imensa', scale)],
  7: (scale) => [spawnMonster('tartaruga_dragao', scale)],
  8: (scale) => [spawnMonster('coriphena', scale, true)],
};

// ── Encontros aleatórios — povos submarinos em guerra (tabela 4d do livro) ──
// Roll 4-24: 4-7=rangers elfos-do-mar, 8-11=bárbaros elfos-do-mar, 12-13=tojanidas,
//            14-15=selakos monstruosos, 16-17=homens-selakos, 18-20=tartaruga-dragão,
//            21-22=sereias feiticeiras, 23-24=sereias clérigas/bardas
export function rollOceanoEncounter(scale: number): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 7) {
    return Array.from({ length: d(6) + d(6) }, () => spawnMonster('elfo_mar_ranger', scale));
  }
  if (roll <= 11) {
    return Array.from({ length: d(6) + d(6) }, () => spawnMonster('elfo_mar_barbaro', scale));
  }
  if (roll <= 13) {
    return Array.from({ length: d(6) + 2 }, () => spawnMonster('tojanida_imensa', scale));
  }
  if (roll <= 17) {
    const count = d(6) + d(6) + 1;
    return Array.from({ length: Math.min(count, 6) }, () => spawnMonster('homem_selako', scale));
  }
  if (roll <= 20) {
    return [spawnMonster('tartaruga_dragao', scale)];
  }
  if (roll <= 22) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('sereia_feiticeira', scale));
  }
  // 23-24: sereias clérigas ou bardas
  const count = Math.max(1, d(6) - 1);
  return Array.from({ length: Math.min(count, 2) }, () =>
    Math.random() < 0.5 ? spawnMonster('sereia_cleriga', scale) : spawnMonster('sereia_barda', scale));
}
