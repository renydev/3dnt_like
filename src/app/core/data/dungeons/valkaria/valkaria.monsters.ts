import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Convertido de "A Libertação de Valkaria" (pág. 113-118) — andar final: todos os
// Guardiões já derrotados ao longo da masmorra retornam como criaturas errantes
// (ressuscitados, recriados ou réplicas mágicas), e o desafio final é contra o
// próprio avatar de Valkaria.

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// Guardiões de cada masmorra anterior, retornando como réplicas (tabela 4d do livro).
// O Guardião de Sszzaaz (réplica do próprio aventureiro) não tem template estático —
// veja a observação já registrada no bestiário de Sszzaas.
const RETURNING_GUARDIANS = [
  'fallandi', 'gromthar', 'sharindhallenrannas', 'tandan', 'tigre_primordial',
  'prislanya', 'ravarimm', 'al_khab', 'potentius', 'sathane', 'yon_ude',
  'darkazimm', 'coriphena', 'reyjane', 'destrukto', 'bhaltan', 'hit',
  'thomar_steelwill', 'karlya',
];

function spawnReturningGuardian(scale: number): Enemy {
  const id = RETURNING_GUARDIANS[Math.floor(Math.random() * RETURNING_GUARDIANS.length)];
  return spawnMonster(id, scale);
}

// IDs de sala conforme valkaria.config.ts layout:
//  1, 2, 4 = Câmaras das Réplicas (monster) — Guardiões retornando
//  7 = Câmara do Avatar de Valkaria (boss) — desafio final
export const VALKARIA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnReturningGuardian(scale)],
  2: (scale) => [spawnReturningGuardian(scale)],
  4: (scale) => [spawnReturningGuardian(scale)],
  7: (scale) => [spawnMonster('avatar_valkaria', scale, true)],
};

// ── Encontros aleatórios — os Guardiões de toda a aventura retornam ──
export function rollValkariaEncounter(scale: number): Enemy[] {
  if (d(6) <= 2) return [spawnReturningGuardian(scale)];
  return [];
}
