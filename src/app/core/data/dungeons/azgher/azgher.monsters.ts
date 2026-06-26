import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Azgher — convertido de "A Libertação de Valkaria" (pág. 61-64).

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme azgher.config.ts layout:
//  2 = Câmara da Múmia       (monster)
//  5 = Câmara dos Escorpiões (monster)
//  7 = Câmara da Grande Esfinge (boss) — Al-khab, o couatl-sol
export const AZGHER_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  2: (scale) => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('mumia', scale));
  },
  5: (scale) => {
    const count = d(6);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('escorpiao_imenso', scale));
  },
  7: (scale) => [spawnMonster('alkhab', scale, true)],
};

// ── Encontros aleatórios — monstros aprisionados do deserto (tabela 4d do livro) ──
// Roll 4-24: 4-5=dragonnes, 6-7=andro-esfinges, 8-9=hieraco-esfinges, 10-12=gino-esfinges,
//            13=escorpiões imensos, 14-15=lamias, 16-18=múmias, 19-20=escorpiões colossais,
//            21-22=elemental da areia, 23-24=efreet
export function rollAzgherEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 5) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('dragonne', scale));
  }
  if (roll <= 7) {
    return [spawnMonster('androesfinge', scale)];
  }
  if (roll <= 9) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('hieracoesfinge', scale));
  }
  if (roll <= 12) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('ginoesfinge', scale));
  }
  if (roll === 13) {
    return Array.from({ length: d(6) }, () => spawnMonster('escorpiao_imenso', scale));
  }
  if (roll <= 15) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('lamia', scale));
  }
  if (roll <= 18) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('mumia', scale));
  }
  if (roll <= 20) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('escorpiao_colossal', scale));
  }
  if (roll <= 22) {
    return [spawnMonster('elemental_areia', scale)];
  }
  // 23-24: efreet
  return [spawnMonster('efreet', scale)];
}
