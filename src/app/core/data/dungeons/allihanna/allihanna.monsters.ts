import { Enemy } from '../../../models/combat.model';
import { calcEnemyPP } from '../../../utils/pp-calculator';

// ── Definições base de monstros de Allihanna ─────────────────────────────────
// Estatísticas canônicas de "A Libertação de Valkaria" (Jambô, 2004)
// HP explícito conforme a fonte; PdF ignorado no combate atual

export interface MonsterTemplate {
  name: string;
  icon: string;
  flavorText: string;
  forca: number;
  habilidade: number;
  resistencia: number;
  armadura: number;
  poderFogo: number;
  hp?: number;
  xpReward: number;
  goldReward: number;
}

export const ALLIHANNA_MONSTERS: Record<string, MonsterTemplate> = {
  elefante: {
    name: 'Elefante', icon: '🐘',
    flavorText: 'Manada protetora às margens do lago — se assustam com invasores e lutam até a morte pelos filhotes.',
    forca: 5, habilidade: 1, resistencia: 4, armadura: 1, poderFogo: 1,
    hp: 20,
    xpReward: 12, goldReward: 0,
  },
  assassino_savana: {
    name: 'Assassino da Savana', icon: '🐆',
    flavorText: 'Felino com quatro pares de patas que salta da grama alta para atacar com garras e mordida simultaneamente.',
    forca: 6, habilidade: 3, resistencia: 6, armadura: 3, poderFogo: 0,
    hp: 30,
    xpReward: 18, goldReward: 0,
  },
  urso_coruja: {
    name: 'Urso-Coruja', icon: '🦉',
    flavorText: 'Predador territorial coberto de penas escuras e pelos amarronzados. Ataca com garras e bico sem hesitar.',
    forca: 5, habilidade: 2, resistencia: 4, armadura: 3, poderFogo: 0,
    hp: 20,
    xpReward: 14, goldReward: 0,
  },
  urso_coruja_imenso: {
    name: 'Urso-Coruja Imenso', icon: '🦉',
    flavorText: 'Talvez o maior urso-coruja de toda Arton. Confronta intrusos com fúria absoluta e luta até a morte.',
    forca: 7, habilidade: 1, resistencia: 5, armadura: 5, poderFogo: 0,
    hp: 25,
    xpReward: 25, goldReward: 0,
  },
  leao_fallandi: {
    name: 'Leão de Fallandi', icon: '🦁',
    flavorText: 'Leão maior que o comum, companheiro do druida. Ágil e feroz, protege seu mestre com garras e mordida.',
    forca: 3, habilidade: 3, resistencia: 2, armadura: 0, poderFogo: 0,
    hp: 15,
    xpReward: 10, goldReward: 0,
  },
  urso_vegetal: {
    name: 'Urso Vegetal', icon: '🌿',
    flavorText: 'Criatura invocada pela magia Criatura Mágica de Fallandi. Construto feito de matéria vegetal — vulnerável ao fogo.',
    forca: 2, habilidade: 1, resistencia: 2, armadura: 0, poderFogo: 0,
    hp: 20,
    xpReward: 8, goldReward: 0,
  },
  fallandi: {
    name: 'Fallandi', icon: '🌿',
    flavorText: 'Meio humano, meio dríade — o Guardião de Allihanna. Druida que serve a deusa no labirinto com seriedade absoluta.',
    forca: 3, habilidade: 3, resistencia: 3, armadura: 1, poderFogo: 0,
    hp: 12,
    xpReward: 30, goldReward: 10,
  },
};

export function spawnMonster(key: string, isBoss = false): Enemy {
  const tpl = ALLIHANNA_MONSTERS[key];
  const hp = tpl.hp ?? tpl.resistencia * 5;
  return {
    id: `${key}_${Math.random().toString(36).slice(2, 7)}`,
    name: tpl.name,
    icon: tpl.icon,
    flavorText: tpl.flavorText,
    hp,
    maxHp: hp,
    forca: tpl.forca,
    habilidade: tpl.habilidade,
    resistencia: tpl.resistencia,
    armadura: tpl.armadura,
    pp: calcEnemyPP(tpl.forca, tpl.habilidade, tpl.armadura, tpl.resistencia),
    xpReward: tpl.xpReward,
    goldReward: tpl.goldReward,
    isBoss,
  };
}

// ── Grupos de inimigos por câmara (andar 1) ──────────────────────────────────

export type RoomEnemyGroup = () => Enemy[];

function d(sides: number) { return Math.ceil(Math.random() * sides); }

export const ALLIHANNA_ROOM_ENEMIES: Record<number, RoomEnemyGroup> = {
  // Sala I — O Lago: manada de elefantes (3d+2, limitado a 4)
  1: () => {
    const count = Math.min(4, d(6) + d(6) + d(6) + 2);
    return Array.from({ length: count }, () => spawnMonster('elefante'));
  },
  // Sala 2 oeste — As Feras Assassinas: 1d–1 assassinos (mínimo 1)
  2: () => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('assassino_savana'));
  },
  // Sala 2 leste — As Feras Assassinas: igual à oeste
  3: () => {
    const count = Math.max(1, d(6) - 1);
    return Array.from({ length: Math.min(count, 3) }, () => spawnMonster('assassino_savana'));
  },
  // Sala 3 — Caverna dos Ursos: 1d+5 ursos-coruja (limitado a 4)
  4: () => {
    const count = Math.min(4, d(6) + 5);
    return Array.from({ length: count }, () => spawnMonster('urso_coruja'));
  },
  // Sala 3a — Câmara do Urso-Coruja Imenso
  5: () => [spawnMonster('urso_coruja_imenso', true)],
  // Sala 4 — O Druida Defensor: Fallandi + leão + urso vegetal
  6: () => [
    spawnMonster('fallandi', true),
    spawnMonster('leao_fallandi'),
    spawnMonster('urso_vegetal'),
  ],
};

// ── Encontros aleatórios não usados no andar 1 (reserva) ─────────────────────
export function rollAllihannaEncounter(): Enemy[] {
  const roll = d(6);
  if (roll <= 2) return [spawnMonster('elefante')];
  if (roll <= 4) return [spawnMonster('assassino_savana')];
  return [spawnMonster('urso_coruja')];
}
