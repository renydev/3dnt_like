import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Tenebra — convertido de "A Libertação de Valkaria" (pág. 55-60).

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme tenebra.config.ts layout:
//  1 = Câmara dos Zumbis      (monster)
//  4 = Câmara do Wight        (monster) — sem stats próprios no livro, usa esqueleto colossal
//  7 = Antro do Vampiro Menor (monster) — Verrkash, o mago-fantasma
//  8 = Câmara do Vampiro Ancião (boss) — Ravarimm
export const TENEBRA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  1: (scale) => {
    const count = d(6);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('zumbi_enorme', scale));
  },
  4: (scale) => {
    const count = d(6);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('esqueleto_colossal', scale));
  },
  7: (scale) => [spawnMonster('verrkash', scale)],
  8: (scale) => [spawnMonster('ravarimm', scale, true)],
};

// ── Encontros aleatórios — mortos-vivos e servos das trevas (tabela 4d do livro) ──
// Roll 4-24: 4-5=vultos alados, 6-7=trogloditas, 8-10=zumbis, 11-12=esqueletos,
//            13-14=anões guerreiros, 15-18=devoradores, 19-20=bodaks, 21-22=aparições, 23-24=andarilhos
export function rollTenebraEncounter(scale: number): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 5) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('vulto_alado', scale));
  }
  if (roll <= 7) {
    return [spawnMonster('troglodita_guerreiro', scale)];
  }
  if (roll <= 10) {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('zumbi_enorme', scale));
  }
  if (roll <= 12) {
    const count = d(6) * 2;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('esqueleto_colossal', scale));
  }
  if (roll <= 14) {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('troglodita_guerreiro', scale));
  }
  if (roll <= 18) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('devorador', scale));
  }
  if (roll <= 20) {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('bodak', scale));
  }
  if (roll <= 22) {
    const count = d(6) + 2;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('aparicao', scale));
  }
  // 23-24: andarilhos noturnos
  const count = Math.max(1, d(6) - 2);
  return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('andarilho_noturno', scale));
}
