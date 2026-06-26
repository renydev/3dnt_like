import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Glorienn — convertido de "A Libertação de Valkaria" (pág. 38-42).

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme glorienn.config.ts layout:
//  2 = Arqueiros de Emboscada (monster)
//  7 = Mago Élfico de Elite   (monster)
//  8 = Torre do Arqueiro Arcano (boss) — Sharindhallenrannas
export const GLORIENN_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  2: (scale) => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('arqueiro_elfo', scale));
  },
  7: (scale) => [
    spawnMonster('mago_elfo', scale),
    ...Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('guerreiro_elfo', scale)),
  ],
  8: (scale) => [spawnMonster('sharindhallenrannas', scale, true)],
};

// ── Encontros aleatórios — equipes élficas de patrulha (tabela 4d do livro) ──
// Roll 4-24: 4-5=magos+guerreiros, 6=bardos+guerreiros, 7-10=rangers, 11-15=guerreiros,
//            16=mago+guerreiros, 17-18/21-22=arqueiros, 19-20=mago+rangers, 23-24=magos+bardos
export function rollGloriennEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 5) {
    const magos = Math.max(1, d(6) - 2);
    const guerreiros = d(6) + 1;
    return [
      ...Array.from({ length: Math.min(magos, 2) }, () => spawnMonster('mago_elfo', scale)),
      ...Array.from({ length: Math.min(guerreiros, 4) }, () => spawnMonster('guerreiro_elfo', scale)),
    ];
  }
  if (roll === 6) {
    const bardos = Math.max(1, d(6) - 2);
    const guerreiros = d(6) + 1;
    return [
      ...Array.from({ length: Math.min(bardos, 2) }, () => spawnMonster('bardo_elfo', scale)),
      ...Array.from({ length: Math.min(guerreiros, 4) }, () => spawnMonster('guerreiro_elfo', scale)),
    ];
  }
  if (roll <= 10) {
    const count = Math.max(1, d(6) - 2);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('ranger_elfo', scale));
  }
  if (roll <= 15) {
    const count = d(6);
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('guerreiro_elfo', scale));
  }
  if (roll === 16) {
    const guerreiros = Math.max(1, d(6) - 2);
    return [spawnMonster('mago_elfo', scale), ...Array.from({ length: Math.min(guerreiros, 2) }, () => spawnMonster('guerreiro_elfo', scale))];
  }
  if (roll <= 18 || (roll >= 21 && roll <= 22)) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('arqueiro_elfo', scale));
  }
  if (roll <= 20) {
    const rangers = Math.max(1, d(6) - 2);
    return [spawnMonster('mago_elfo', scale), ...Array.from({ length: Math.min(rangers, 2) }, () => spawnMonster('ranger_elfo', scale))];
  }
  // 23-24: magos + bardos
  const magos = d(6);
  const bardos = Math.max(1, d(6) - 2);
  return [
    ...Array.from({ length: Math.min(magos, 3) }, () => spawnMonster('mago_elfo', scale)),
    ...Array.from({ length: Math.min(bardos, 2) }, () => spawnMonster('bardo_elfo', scale)),
  ];
}
