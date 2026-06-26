import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { ALL_MONSTER_IDS, spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Convertido de "A Libertação de Valkaria" (pág. 103-108) — Nimb é o Deus do Caos:
// sua tabela de encontros no livro lista NPCs de outro sourcebook (Holy Avenger
// 3D&T) que não temos como converter aqui. Em vez de inventar substitutos,
// sorteamos literalmente qualquer monstro já cadastrado no bestiário (de
// qualquer andar) — a tradução mais fiel possível de "criaturas ao acaso
// pelos planos, vivas ou mortas, conhecidas ou não".

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

/** Sorteia um monstro qualquer do bestiário inteiro — o "caos" de Nimb. */
function spawnChaosMonster(scale: GrowthScale): Enemy {
  const id = ALL_MONSTER_IDS[Math.floor(Math.random() * ALL_MONSTER_IDS.length)];
  return spawnMonster(id, scale);
}

// Salas 1, 3 e 5 (monster, layout atual): encontros caóticos — qualquer monstro do bestiário.
// Sala 7 (boss): Hit, a clériga de Nimb, Guardiã da Ponte.
export const NIMB_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => [spawnChaosMonster(scale)],
  3: (scale) => [spawnChaosMonster(scale)],
  5: (scale) => [spawnChaosMonster(scale)],
  7: (scale) => [spawnMonster('hit', scale, true)],
};

// ── Encontros aleatórios — o caos não segue tabela fixa ──
// 1 em 6: uma fera-do-caos "nativa" do Reino de Nimb; 1 em 30 (raríssimo): o
// Tarrasque; do contrário, qualquer monstro ao acaso do bestiário inteiro.
export function rollNimbEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(30);
  if (roll === 1) return [spawnMonster('tarrasque', scale)];
  if (roll <= 6) return [spawnMonster('fera_caos', scale)];
  return [spawnChaosMonster(scale)];
}
