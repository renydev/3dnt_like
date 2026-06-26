import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Hyninn — convertido de "A Libertação de Valkaria" (pág. 48-50).

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// Sala 4 (monster, layout atual): um Duplo emboscando disfarçado.
// Sala 8 (boss, layout atual): o Tigre Primordial — vencê-lo não basta; ainda é
// preciso encontrar e destruir um dos Duplos espalhados pela masmorra (ver livro).
export const HYNINN_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  4: (scale) => [spawnMonster('duplo', scale)],
  8: (scale) => [spawnMonster('tigre_primordial', scale, true)],
};

// ── Encontros aleatórios — armadilhas e construtos traiçoeiros (tabela 4d do livro) ──
// Roll 4-24: 4-6=mímicos, 7-11=golens de pedra, 12-15=gárgulas, 16-22=phasm, 23-24=tigres
export function rollHyninnEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 6) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('mimico', scale));
  }
  if (roll <= 11) {
    const count = roll <= 8 ? 1 : Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('golem_pedra', scale));
  }
  if (roll <= 15) {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('gargula', scale));
  }
  if (roll <= 22) {
    return [spawnMonster('phasm', scale)];
  }
  // 23-24: tigres-de-Hyninn
  const count = Math.max(1, d(6) - 1);
  return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('tigre_hyninn', scale));
}
