import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Keenn — convertido de "A Libertação de Valkaria" (pág. 94-97).

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme keenn.config.ts layout:
//  1, 2 = salas de combatentes (monster)
//  5 = Câmara do Campeão (monster) — Harkash, o diabo cornugon
//  7 = Arena do Cavaleiro de Ferro (boss) — Destrukto
export const KEENN_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => Array.from({ length: d(6) }, () => spawnMonster('combatente_keenn', scale)),
  2: (scale) => Array.from({ length: d(6) }, () => spawnMonster('combatente_keenn', scale)),
  5: (scale) => [spawnMonster('harkash', scale)],
  7: (scale) => [spawnMonster('destrukto', scale, true)],
};

// ── Encontros aleatórios — campeões do torneio de Keenn (tabela 4d do livro) ──
// O livro só varia a raça dos combatentes (todos com PP equivalente), então
// toda a tabela 4d resolve para o mesmo monstro-base, em quantidades variadas.
export function rollKeennEncounter(scale: number): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);
  const count = roll <= 22 ? d(6) : Math.max(1, d(6) - 4);
  return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('combatente_keenn', scale));
}
