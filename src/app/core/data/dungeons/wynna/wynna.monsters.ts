import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Wynna — convertido de "A Libertação de Valkaria" (pág. 76-79).

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// Sala 4 (monster, layout atual): feiticeiros instruídos por Wynna.
// Sala 8 (boss, layout atual): Darkazimm, o gênio das trevas aprisionado.
export const WYNNA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  4: (scale) => Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('feiticeiro_wynna', scale)),
  8: (scale) => [spawnMonster('darkazimm', scale, true)],
};

// ── Encontros aleatórios — fadas, gênios e magos de Wynna (tabela 4d do livro) ──
// Roll 4-24: 4-6=djinns, 7=sprites feiticeiros, 8-9=elementais, 10-13=feiticeiros,
//            14-16=hidra branca, 17=ninfa, 18-19=mago, 20-21=feiticeiros, 22-24=aasimar feiticeiros
export function rollWynnaEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 6) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('djinn_enorme', scale));
  }
  if (roll === 7) {
    return [spawnMonster('feiticeiro_wynna', scale)];
  }
  if (roll <= 9) {
    return [spawnMonster('elemental_wynna', scale)];
  }
  if (roll <= 16) {
    if (roll <= 13) {
      const count = Math.max(1, d(6) - 1);
      return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('feiticeiro_wynna', scale));
    }
    return [spawnMonster('hidra_branca', scale)];
  }
  if (roll === 17) {
    return [spawnMonster('ninfa_wynna', scale)];
  }
  // 18-24: magos e feiticeiros (incluindo aasimar)
  const count = Math.max(1, d(6) - 1);
  return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('feiticeiro_wynna', scale));
}
