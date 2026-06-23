import { Enemy } from '../../../models/combat.model';
import { calcEnemyPP } from '../../../utils/pp-calculator';

// ── Definições base de monstros de Allihanna ─────────────────────────────────
// Estatísticas canônicas de "A Libertação de Valkaria" (Jambô, 2004), convertidas
// de 3D&T Alpha para 3DeT Victory pelas regras oficiais de conversão:
//   Poder       = floor((Força + Poder de Fogo) / 2)
//   Resistência = floor((Armadura + Resistência) / 2)
// Armadura não existe mais como atributo separado — foi absorvida em Resistência.

export interface MonsterTemplate {
  name: string;
  icon: string;
  sprite?: string;
  flavorText: string;
  poder: number;
  habilidade: number;
  resistencia: number;
  hp?: number;
  xpReward: number;
  goldReward: number;
}

export const ALLIHANNA_MONSTERS: Record<string, MonsterTemplate> = {
  // ── Salas fixas ──────────────────────────────────────────────────────────────

  elefante: {
    name: 'Elefante', icon: '🐘',
    flavorText: 'Manada protetora às margens do lago — se assustam com invasores e lutam até a morte pelos filhotes.',
    // Alpha: F5 R4 A1 PF1 → P=floor((5+1)/2)=3, R=floor((1+4)/2)=2
    poder: 3, habilidade: 1, resistencia: 2,
    hp: 20,
    xpReward: 12, goldReward: 0,
  },
  assassino_savana: {
    name: 'Assassino da Savana', icon: '🐆',
    flavorText: 'Felino com quatro pares de patas que salta da grama alta para atacar com garras e mordida simultaneamente.',
    // Alpha: F6 R6 A3 PF0 → P=3, R=floor((3+6)/2)=4
    poder: 3, habilidade: 3, resistencia: 4,
    hp: 30,
    xpReward: 18, goldReward: 0,
  },
  urso_coruja: {
    name: 'Urso-Coruja', icon: '🦉', sprite: 'urso-coruja.png',
    flavorText: 'Predador territorial coberto de penas escuras e pelos amarronzados. Ataca com garras e bico sem hesitar.',
    // Alpha: F5 R4 A3 PF0 → P=2, R=floor((3+4)/2)=3
    poder: 2, habilidade: 2, resistencia: 3,
    hp: 20,
    xpReward: 14, goldReward: 0,
  },
  urso_coruja_imenso: {
    name: 'Urso-Coruja Imenso', icon: '🦉', sprite: 'urso-coruja.png',
    flavorText: 'Talvez o maior urso-coruja de toda Arton. Confronta intrusos com fúria absoluta e luta até a morte.',
    // Alpha: F7 R5 A5 PF0 → P=3, R=floor((5+5)/2)=5
    poder: 3, habilidade: 1, resistencia: 5,
    hp: 25,
    xpReward: 25, goldReward: 0,
  },
  leao_fallandi: {
    name: 'Leão de Fallandi', icon: '🦁',
    flavorText: 'Leão maior que o comum, companheiro do druida. Ágil e feroz, protege seu mestre com garras e mordida.',
    // Alpha: F3 R2 A0 PF0 → P=1, R=1
    poder: 1, habilidade: 3, resistencia: 1,
    hp: 15,
    xpReward: 10, goldReward: 0,
  },
  urso_vegetal: {
    name: 'Urso Vegetal', icon: '🌿',
    flavorText: 'Criatura invocada pela magia Criatura Mágica de Fallandi. Construto feito de matéria vegetal — vulnerável ao fogo.',
    // Alpha: F2 R2 A0 PF0 → P=1, R=1
    poder: 1, habilidade: 1, resistencia: 1,
    hp: 20,
    xpReward: 8, goldReward: 0,
  },
  fallandi: {
    name: 'Fallandi', icon: '🌿',
    flavorText: 'Meio humano, meio dríade — o Guardião de Allihanna. Druida que serve a deusa no labirinto com seriedade absoluta.',
    // Alpha: F3 R3 A1 PF0 → P=1, R=2
    poder: 1, habilidade: 3, resistencia: 2,
    hp: 12,
    xpReward: 30, goldReward: 10,
  },

  // ── Encontros aleatórios (tabela 4d6) ────────────────────────────────────────

  druida_allihanna: {
    name: 'Druida de Allihanna', icon: '🌱',
    flavorText: 'Servo da Mãe Natureza. Prefere a paz, mas defende a floresta com magia e animais aliados.',
    // Alpha: F1 R2 A2 PF2 → P=floor((1+2)/2)=1, R=floor((2+2)/2)=2
    poder: 1, habilidade: 3, resistencia: 2,
    hp: 10,
    xpReward: 10, goldReward: 5,
  },
  ranger: {
    name: 'Ranger', icon: '🏹',
    flavorText: 'Explorador da floresta, habilidoso com arco e espada. Ataca múltiplas vezes com agilidade.',
    // Alpha: F2 R2 A2 PF3 → P=floor((2+3)/2)=2, R=2
    poder: 2, habilidade: 3, resistencia: 2,
    hp: 10,
    xpReward: 10, goldReward: 3,
  },
  centauro_ranger: {
    name: 'Centauro Ranger', icon: '🐴', sprite: 'centauro-combatente.png',
    flavorText: 'Meio homem, meio cavalo — patrulha a floresta com arco na mão e casco certeiro.',
    // Alpha: F2 R2 A2 PF2 → P=2, R=2
    poder: 2, habilidade: 3, resistencia: 2,
    hp: 10,
    xpReward: 11, goldReward: 0,
  },
  lobo_cavernas: {
    name: 'Lobo-das-Cavernas', icon: '🐺', sprite: 'lobo-das-cavernas.png',
    flavorText: 'Lobo maior e mais feroz que o comum. Caça em matilha, fareja presas a grande distância.',
    // Alpha: F1 R2 A1 PF0 → P=0, R=floor((1+2)/2)=1
    poder: 0, habilidade: 2, resistencia: 1,
    hp: 10,
    xpReward: 6, goldReward: 0,
  },
  grifo: {
    name: 'Grifo', icon: '🦅', sprite: 'grifo.png',
    flavorText: 'Criatura alada com corpo de leão e cabeça de águia. Veloz e letal no ar ou no chão.',
    // Alpha: F2 R4 A1 PF0 → P=1, R=floor((1+4)/2)=2
    poder: 1, habilidade: 5, resistencia: 2,
    hp: 20,
    xpReward: 16, goldReward: 0,
  },
  gorila: {
    name: 'Gorila', icon: '🦍',
    flavorText: 'Primata colossal, territorialmente agressivo. Conhecido por habitar esta masmorra.',
    // Alpha: F2 R2 A1 PF0 → P=1, R=floor((1+2)/2)=1
    poder: 1, habilidade: 2, resistencia: 1,
    hp: 10,
    xpReward: 8, goldReward: 0,
  },
  driade: {
    name: 'Dríade', icon: '🌳',
    flavorText: 'Espírito feminino das árvores. Imortal enquanto sua árvore existir. Paralisa com um toque.',
    // Alpha: F1 R1 A0 PF0 → P=0, R=0
    poder: 0, habilidade: 2, resistencia: 0,
    hp: 5,
    xpReward: 14, goldReward: 0,
  },
  tigre: {
    name: 'Tigre', icon: '🐯',
    flavorText: 'Predador ágil da floresta, caça de surpresa e retira-se ao perder metade dos PVs.',
    // Alpha: F3 R2 A0 PF0 → P=1, R=1
    poder: 1, habilidade: 3, resistencia: 1,
    hp: 10,
    xpReward: 9, goldReward: 0,
  },
  crocodilo: {
    name: 'Crocodilo', icon: '🐊',
    flavorText: 'Réptil blindado que aguarda imóvel antes de atacar com mordida devastadora.',
    // Alpha: F3 R3 A2 PF0 → P=1, R=floor((2+3)/2)=2
    poder: 1, habilidade: 0, resistencia: 2,
    hp: 15,
    xpReward: 9, goldReward: 0,
  },
  urso_cavernas: {
    name: 'Urso das Cavernas', icon: '🐻',
    flavorText: 'Urso de grande porte que habita as cavernas da floresta. Poderoso e territorial.',
    // Alpha: F4 R3 A1 PF0 → P=2, R=2
    poder: 2, habilidade: 3, resistencia: 2,
    hp: 15,
    xpReward: 12, goldReward: 0,
  },
};

export function spawnMonster(key: string, isBoss = false): Enemy {
  const tpl = ALLIHANNA_MONSTERS[key];
  const hp = tpl.hp ?? tpl.resistencia * 5;
  return {
    id: `${key}_${Math.random().toString(36).slice(2, 7)}`,
    name: tpl.name,
    icon: tpl.icon,
    sprite: tpl.sprite,
    flavorText: tpl.flavorText,
    hp,
    maxHp: hp,
    poder: tpl.poder,
    habilidade: tpl.habilidade,
    resistencia: tpl.resistencia,
    armadura: 0, // Armadura foi absorvida em Resistência na conversão para Victory
    pp: calcEnemyPP(tpl.poder, tpl.habilidade, tpl.resistencia),
    xpReward: tpl.xpReward,
    goldReward: tpl.goldReward,
    isBoss,
  };
}

// ── Grupos de inimigos por câmara (andar 1) ──────────────────────────────────

export type RoomEnemyGroup = () => Enemy[];

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
  0: () => {
    const count = Math.min(5, d(6) + d(6) + d(6) + 2);
    return Array.from({ length: count }, () => spawnMonster('elefante'));
  },
  // Câmara 2 — As Feras (centro): 1d6–1 assassinos, mínimo 1
  3: () => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('assassino_savana'));
  },
  // Câmara 2 — As Feras (esquerda): igual à câmara central
  6: () => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('assassino_savana'));
  },
  // Câmara 3 — Caverna dos Ursos: 1d6+5 ursos-coruja, cap 6
  7: () => {
    const count = Math.min(6, d(6) + 5);
    return Array.from({ length: count }, () => spawnMonster('urso_coruja'));
  },
  // Câmara 3a — Urso-Coruja Imenso (boss da câmara)
  8: () => [spawnMonster('urso_coruja_imenso', true)],
  // Câmara 4 — O Druida Defensor: Fallandi + leão + urso vegetal
  13: () => [
    spawnMonster('fallandi', true),
    spawnMonster('leao_fallandi'),
    spawnMonster('urso_vegetal'),
  ],
};

// ── Encontros aleatórios — trilhas vazias (tabela 4d6 do livro) ──────────────
// Roll 4-24: 4=druidas, 5=rangers, 6-7=centauros, 8-10=lobos, 11-13=grifos,
//            14-16=gorilas, 17-18=dríade, 19-20=tigres, 21-22=crocodilos, 23-24=ursos
export function rollAllihannaEncounter(): Enemy[] {
  const roll = d(6) + d(6) + d(6) + d(6);

  if (roll <= 4) {
    const count = Math.max(1, d(6) + 2);
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('druida_allihanna'));
  }
  if (roll === 5) {
    const count = Math.max(1, d(6) + 2);
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('ranger'));
  }
  if (roll <= 7) {
    const count = d(6);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('centauro_ranger'));
  }
  if (roll <= 10) {
    const count = d(6) + d(6) + 2;
    return Array.from({ length: Math.min(count, 5) }, () => spawnMonster('lobo_cavernas'));
  }
  if (roll <= 13) {
    const count = d(6);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('grifo'));
  }
  if (roll <= 16) {
    const count = Math.max(0, d(6) - 2);
    return count === 0 ? [spawnMonster('gorila')] : Array.from({ length: Math.min(count, 3) }, () => spawnMonster('gorila'));
  }
  if (roll <= 18) {
    return [spawnMonster('driade')];
  }
  if (roll <= 20) {
    const count = d(6) + 1;
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('tigre'));
  }
  if (roll <= 22) {
    const count = d(6) + d(6);
    return Array.from({ length: Math.min(count, 4) }, () => spawnMonster('crocodilo'));
  }
  // 23-24: ursos das cavernas
  const count = d(6);
  return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('urso_cavernas'));
}
