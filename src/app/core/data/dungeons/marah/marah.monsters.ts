import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Marah — convertido de "A Libertação de Valkaria" (pág. 51-55).
// Marah é a masmorra menos violenta do desafio: quase nenhuma sala tem monstro
// "hostil" de verdade (estátuas são ilusórias, dríades e a ninfa são pacíficas).

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// Sala 6 (boss, layout atual): Prislanya, a ninfa Guardiã disfarçada de Valkaria.
export const MARAH_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  6: (scale) => [spawnMonster('prislanya', scale, true)],
};

// ── Encontros aleatórios — servos pacíficos de Marah (tabela 4d do livro) ──
// Roll 4-24: 4-5=clérigas, 6-7=sprites bardos, 8-9=bardos, 10-12=paladinos,
//            13-16=clérigas elfas, 17-21=bardos elfos, 22-24=sprites clérigas
export function rollMarahEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 5) {
    const count = Math.max(1, d(6) - 3);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('clerigo_marah', scale));
  }
  if (roll <= 7) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('sprite_bardo_marah', scale));
  }
  if (roll <= 9) {
    return Array.from({ length: d(6) > 3 ? 2 : 1 }, () => spawnMonster('bardo_marah', scale));
  }
  if (roll <= 12) {
    return Array.from({ length: d(6) > 3 ? 2 : 1 }, () => spawnMonster('paladino_marah', scale));
  }
  if (roll <= 16) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('clerigo_marah', scale));
  }
  if (roll <= 21) {
    const count = Math.max(1, d(6) - 3);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('bardo_marah', scale));
  }
  // 22-24: sprites clérigas
  const count = Math.max(1, d(6) - 1);
  return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('sprite_feiticeiro_marah', scale));
}
