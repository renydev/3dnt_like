import { Enemy } from '../../../models/combat.model';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Thyatis — convertido de "A Libertação de Valkaria" (pág. 85-89).

export type RoomEnemyGroup = (scale: number) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme thyatis.config.ts layout:
//  2 = Câmara dos Salamandros (monster)
//  3 = Câmara dos Ífreets     (monster) — duas efreet cativas
//  7 = Núcleo do Elemental Primordial (boss) — Reyjane, a fênix
export const THYATIS_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  2: (scale) => Array.from({ length: Math.max(1, d(6) - 2) }, () => spawnMonster('salamandra_nobre', scale)),
  3: (scale) => [spawnMonster('efreet', scale), spawnMonster('efreet', scale)],
  7: (scale) => [spawnMonster('reyjane', scale, true)],
};

// ── Encontros aleatórios — feras ígneas da masmorra (tabela 4d do livro) ──
// Roll 4-24: 4-6=thoqqa, 7-9=mastins, 10-11=gigantes do fogo, 12-13=salamandras nobres,
//            14-16=elementais do fogo anciões, 17-19=dragão adulto, 20-24=dragão experiente
export function rollThyatisEncounter(scale: number): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 6) {
    const count = d(6) + d(6) + 4;
    return Array.from({ length: Math.min(count, 6) }, () => spawnMonster('thoqqa', scale));
  }
  if (roll <= 9) {
    const count = d(6) + d(6) + 2;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('mastim_thyatis', scale));
  }
  if (roll <= 11) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('gigante_fogo', scale));
  }
  if (roll <= 13) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('salamandra_nobre', scale));
  }
  if (roll <= 16) {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('elemental_fogo_anciao', scale));
  }
  if (roll <= 19) {
    return [spawnMonster('dragao_vermelho_adulto', scale)];
  }
  // 20-24: dragão vermelho experiente
  return [spawnMonster('dragao_vermelho_experiente', scale)];
}
