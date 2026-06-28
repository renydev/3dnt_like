import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';
import { spawnMonster } from '../../bestiario.data';

export { spawnMonster };

// Os templates dos monstros vivem no bestiário central (core/data/bestiario.data.ts).
// Este arquivo só decide quais monstros aparecem em qual sala e em que quantidade,
// especificamente para Allihanna.
//
// Andar em formato de losango compacto (trilhas: 1-2-3-4-3-2-1, 16 salas) — ver
// allihanna.config.ts e o relatório de balanceamento (debug panel) para o veredito
// de cada monstro:
//  1  = trivial    (Dríade)
//  3  = trivial    (Lobo-das-Cavernas)
//  6  = equilibrado (Urso das Cavernas)
//  7  = hostage     (resgate de refém — capturado por uma matilha de lobos)
// 10  = arriscado  (Elefante — manada do Lago)
// 13  = mortal     (Urso-Coruja Imenso — única trilha mortal antes do chefe)
// 15  = chefe       (Fallandi + Leão de Fallandi + Urso Vegetal)
export type RoomEnemyGroup = (scale: GrowthScale) => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const ALLIHANNA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  // Trilha da Dríade — trivial, primeiro contato do andar.
  1: (scale) => [spawnMonster('driade', scale)],
  // Covil dos Lobos — trivial, matilha pequena.
  3: (scale) => {
    const count = Math.max(1, d(6) - 3);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('lobo_cavernas', scale));
  },
  // Caverna dos Ursos — equilibrado.
  6: (scale) => {
    const count = Math.max(1, d(6) - 4);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('urso_cavernas', scale));
  },
  // Cela dos Cativos — matilha pequena guardando o refém.
  7: (scale) => {
    const count = Math.max(1, d(6) - 4);
    return Array.from({ length: Math.min(count, 2) }, () => spawnMonster('lobo_cavernas', scale));
  },
  // O Lago — arriscado: manada de elefantes (3d6+2, cap 5).
  10: (scale) => {
    const count = Math.min(5, d(6) + d(6) + d(6) + 2);
    return Array.from({ length: count }, () => spawnMonster('elefante', scale));
  },
  // Ninho do Urso-Coruja Imenso — mortal, a única trilha mortal do andar.
  // Obrigações e Restrições (regra especial de Allihanna): não deve ser destruído —
  // o cenário (ver ALLIHANNA_SCENARIOS[13]) oferece um túnel secreto pra contorná-lo.
  13: (scale) => [spawnMonster('urso_coruja_imenso', scale, true)],
  // Câmara do Guardião Final — chefe: Fallandi + leão + urso vegetal.
  15: (scale) => [
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
