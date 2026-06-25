import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Lena — convertido de "A Libertação de Valkaria" (pág. 43-47).

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// Sala 6 (monster, layout atual): covil dos quelicerossauros.
// Sala 8 (boss, layout atual): Tandan, o Dragonete — Guardiã de Lena.
export const LENA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  6: (scale) => {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('quelicerossauro', scale));
  },
  8: (scale) => [spawnMonster('tandan', scale, true)],
};

// ── Encontros aleatórios — fauna mágica enorme da masmorra (tabela 4d do livro) ──
// Roll 4-24: 4-5=dinônicos, 6=sprites, 7-10=cães teleportadores, 11-12=formians,
//            13=carrascos, 14=cobras, 15=lobos, 16-17=lagartos, 18-20=fadas, 22-24=unicórnios
export function rollLenaEncounter(scale: number): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 5) {
    const count = d(6) - 4;
    return Array.from({ length: Math.max(1, Math.min(count, 2)) }, () => spawnMonster('dinonico_enorme', scale));
  }
  if (roll === 6) {
    const count = Math.max(1, d(6) - 2);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('sprite_mago', scale));
  }
  if (roll <= 10) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('cao_teleportador', scale));
  }
  if (roll <= 12) {
    const count = d(6);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('formian_guerreiro', scale));
  }
  if (roll === 13) {
    const count = Math.max(1, d(6) - 2);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('carrasco_lena', scale));
  }
  if (roll === 14) {
    const count = Math.max(1, d(6) - 2);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('cobra_enorme', scale));
  }
  if (roll === 15) {
    const count = Math.max(1, d(6) - 2);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('lobo_enorme', scale));
  }
  if (roll <= 17) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('lagarto_gigante', scale));
  }
  if (roll <= 20) {
    const count = d(6) + d(6) + 1;
    return Array.from({ length: Math.min(count, 5) }, () => spawnMonster('fada_lena', scale));
  }
  // 21-24: unicórnios enormes
  const count = Math.max(1, d(6) - 1);
  return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('unicornio_enorme', scale));
}
