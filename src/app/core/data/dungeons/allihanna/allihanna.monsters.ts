import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// ── Grupos de inimigos por câmara (andar 1) ──────────────────────────────────
// Os templates dos monstros (atributos-base, lore, arquétipo) vivem no bestiário
// central (core/data/bestiario.data.ts) — este arquivo só decide QUAIS monstros
// aparecem em QUAL sala e em QUE quantidade, especificamente para Allihanna.

export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

// IDs de sala conforme allihanna.config.ts layout:
//  0 = O Lago            (monster)
//  3 = Feras — Centro    (monster)
//  6 = Feras — Esquerda  (monster)
//  7 = Caverna dos Ursos (monster)
//  8 = Urso-Coruja Imenso (monster) — câmara 3a
// 13 = Druida Defensor   (boss)
// Salas 2, 5, 9, 10, 14 são corredores vazios → apenas encontros aleatórios
export const ALLIHANNA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  // Câmara 1 — O Lago: manada de elefantes (3d6+2, cap 5)
  0: (scale) => {
    const count = Math.min(5, d(6) + d(6) + d(6) + 2);
    return Array.from({ length: count }, () => spawnMonster('elefante', scale));
  },
  // Câmara 2 — As Feras (centro): 1d6–1 assassinos, mínimo 1
  3: (scale) => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('assassino_savana', scale));
  },
  // Câmara 2 — As Feras (esquerda): igual à câmara central
  6: (scale) => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('assassino_savana', scale));
  },
  // Câmara 3 — Caverna dos Ursos: 1d6+5 ursos-coruja, cap 6
  7: (scale) => {
    const count = Math.min(6, d(6) + 5);
    return Array.from({ length: count }, () => spawnMonster('urso_coruja', scale));
  },
  // Câmara 3a — Urso-Coruja Imenso (boss da câmara)
  8: (scale) => [spawnMonster('urso_coruja_imenso', scale, true)],
  // Câmara 4 — O Druida Defensor: Fallandi + leão + urso vegetal
  13: (scale) => [
    spawnMonster('fallandi', scale, true),
    spawnMonster('leao_fallandi', scale),
    spawnMonster('urso_vegetal', scale),
  ],
};

// ── Encontros aleatórios — trilhas vazias (tabela 4d6 do livro) ──────────────
// Roll 4-24: 4=druidas, 5=rangers, 6-7=centauros, 8-10=lobos, 11-13=grifos,
//            14-16=gorilas, 17-18=dríade, 19-20=tigres, 21-22=crocodilos, 23-24=ursos
export function rollAllihannaEncounter(scale: GrowthScale): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 4) {
    const count = Math.max(1, d(6) + 2);
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('druida_allihanna', scale));
  }
  if (roll === 5) {
    const count = Math.max(1, d(6) + 2);
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('ranger', scale));
  }
  if (roll <= 7) {
    const count = d(6);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('centauro_ranger', scale));
  }
  if (roll <= 10) {
    const count = d(6) + d(6) + 2;
    return Array.from({ length: Math.min(count, 5) }, () => spawnMonster('lobo_cavernas', scale));
  }
  if (roll <= 13) {
    const count = d(6);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('grifo', scale));
  }
  if (roll <= 16) {
    const count = Math.max(0, d(6) - 2);
    return count === 0 ? [spawnMonster('gorila', scale)] : Array.from({ length: Math.min(count, 3) }, () => spawnMonster('gorila', scale));
  }
  if (roll <= 18) {
    return [spawnMonster('driade', scale)];
  }
  if (roll <= 20) {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('tigre', scale));
  }
  if (roll <= 22) {
    const count = d(6) + d(6);
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('crocodilo', scale));
  }
  // 23-24: ursos das cavernas
  const count = d(6);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('urso_cavernas', scale));
}
