import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Lin-Wu — convertido de "A Libertação de Valkaria" (pág. 73-75).

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// Salas 1, 3 e 5 (monster, layout atual): artistas marciais da Ordem do Sonho.
// Sala 7 (boss): Yon-ude Hebi, o naga de quatro braços.
export const LIN_WU_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => Array.from({ length: d(6) + 1 }, () => spawnMonster('artista_marcial', scale)),
  3: (scale) => Array.from({ length: d(6) + 1 }, () => spawnMonster('artista_marcial', scale)),
  5: (scale) => Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('artista_marcial', scale)),
  7: (scale) => [spawnMonster('yon_ude', scale, true)],
};

// ── Encontros aleatórios — artistas marciais da Ordem dos Defensores do Sonho ──
// O livro só dá o custo em PP por grupo (não há "tipos" mecanicamente distintos
// além da quantidade), então toda a tabela 4d resolve para o mesmo monstro-base.
export function rollLinWuEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);
  const count = roll <= 6 ? d(6) + 2 : roll <= 17 ? d(6) + 3 : Math.max(1, d(6) - 3);
  return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('artista_marcial', scale));
}
