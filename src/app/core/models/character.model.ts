import { Item, Equipment } from './item.model';
export type { Item, Equipment };

export type CharacterClass =
  | 'guerreiro' | 'mago' | 'ladino' | 'clerigo' | 'ranger'
  | 'bardo' | 'druida' | 'paladino' | 'barbaro' | 'monge';

export type CharacterRace =
  | 'humano' | 'elfo' | 'anao' | 'halfling' | 'gnomo'
  | 'meio-elfo' | 'meio-orc' | 'lefou' | 'minotauro' | 'goblin';

export type CharacterRole = 'tank' | 'dps' | 'healer' | 'mage';

// ─── FOCOS DE MAGIA (6 Caminhos Elementais do 3D&T) ─────────────────────────
export type FocusPath = 'fogo' | 'agua' | 'ar' | 'terra' | 'luz' | 'trevas';

export interface FocusPaths {
  fogo:   number;  // 0–5
  agua:   number;
  ar:     number;
  terra:  number;
  luz:    number;
  trevas: number;
}

export const FOCUS_PATH_LABELS: Record<FocusPath, string> = {
  fogo:   'Fogo',
  agua:   'Água',
  ar:     'Ar',
  terra:  'Terra',
  luz:    'Luz',
  trevas: 'Trevas',
};

export const FOCUS_PATH_ICONS: Record<FocusPath, string> = {
  fogo:   '🔥',
  agua:   '💧',
  ar:     '🌪️',
  terra:  '🪨',
  luz:    '✨',
  trevas: '🌑',
};

export const FOCUS_PATHS: FocusPath[] = ['fogo', 'agua', 'ar', 'terra', 'luz', 'trevas'];

export const EMPTY_FOCUS: FocusPaths = { fogo: 0, agua: 0, ar: 0, terra: 0, luz: 0, trevas: 0 };

export const CLASS_ROLES: Record<CharacterClass, CharacterRole> = {
  guerreiro: 'tank',
  paladino:  'tank',
  barbaro:   'tank',
  ladino:    'dps',
  ranger:    'dps',
  monge:     'dps',
  clerigo:   'healer',
  druida:    'healer',
  mago:      'mage',
  bardo:     'mage',
};

export const ROLE_COMPLEMENTS: Record<CharacterRole, [CharacterRole, CharacterRole, CharacterRole]> = {
  tank:   ['dps', 'healer', 'mage'],
  dps:    ['tank', 'healer', 'mage'],
  healer: ['tank', 'dps',   'mage'],
  mage:   ['tank', 'dps',   'healer'],
};

export interface Attribute {
  base: number;
  current: number;
  max: number;
}

export interface StatusEffect {
  id: string;
  name: string;
  icon: string;
  duration: number; // rodadas restantes, -1 = permanente
  description: string;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  race: CharacterRace;
  level: number;
  xp: number;
  xpToNextLevel: number;

  // Atributos 3D&T
  forca: Attribute;       // F - Força
  habilidade: Attribute;  // H - Habilidade
  resistencia: Attribute; // R - Resistência
  armadura: number;       // A - Armadura
  poderFogo: Attribute; // PF - Poder de Fogo

  // PV = R * 5 no 3D&T
  pontosVida: Attribute;

  // PM = Pontos de Mana (consumível para habilidades)
  pontosMana: Attribute;

  // Vantagens/Desvantagens/Perícias
  vantagens: string[];
  desvantagens: string[];
  pericias?: string[]; // IDs das perícias compradas (cada uma custa 3 pts)

  // Estado
  gold: number;
  inventory: Item[];      // itens no inventário (consumíveis + não equipados)
  equipment: Equipment;   // itens equipados por slot (weapon, offhand, armor, head, gloves, boots, ring_left, ring_right)
  statusEffects: StatusEffect[];

  // Focos de Magia — 6 Caminhos Elementais (qualquer classe pode ter)
  focus?: FocusPaths;

  // Modificadores raciais (separados da base para cálculo correto de custo)
  racialMods?: Partial<Record<'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'poderFogo', number>>;

  // Evolução — pontos disponíveis para gastar em atributos
  levelUpPoints?: number;

  // Metadados visuais
  isCompanion?: boolean;
  portraitIcon?: string; // emoji ou caminho de asset
  patronGod?: string;    // ID do deus de devoção (ex: 'allihanna', 'khalmyr')
}

import { ITEM_CATALOG } from './item.model';
const I = ITEM_CATALOG;

/**
 * 10 personagens lendários (tier Lenda).
 * Regras: nenhum atributo ultrapassa 5; PF mínimo 1; PV = R*5 (mín 1).
 */
export const PRESET_CHARACTERS: Omit<Character, 'id'>[] = [
  // ── TANKS ────────────────────────────────────────────────────────────────
  {
    name: 'Thorvald Chifre-de-Ferro',
    class: 'barbaro',
    race: 'minotauro',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 5, current: 5, max: 5 },
    habilidade: { base: 1, current: 1, max: 1 },
    resistencia:{ base: 5, current: 5, max: 5 },
    armadura: 3,
    poderFogo:  { base: 1, current: 1, max: 1 },
    pontosVida: { base: 25, current: 25, max: 25 },
    pontosMana: { base: 5, current: 5, max: 5 },
    vantagens: ['Fúria Bárbara', 'Alma Primitiva', 'Chifrada'],
    desvantagens: ['Instinto Bestial'],
    gold: 15,
    inventory: [I['pocao-cura'], I['pocao-cura']],
    equipment: { weapon: I['machado-guerra'], armor: I['gibao-couro'], head: I['capacete-ferro'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🪓',
  },
  {
    name: 'Rael Ferrobravo',
    class: 'guerreiro',
    race: 'meio-orc',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 5, current: 5, max: 5 },
    habilidade: { base: 2, current: 2, max: 2 },
    resistencia:{ base: 4, current: 4, max: 4 },
    armadura: 4,
    poderFogo:  { base: 1, current: 1, max: 1 },
    pontosVida: { base: 20, current: 20, max: 20 },
    pontosMana: { base: 4, current: 4, max: 4 },
    vantagens: ['Ataque Duplo', 'Especialização em Arma', 'Implacável'],
    desvantagens: ['Má Fama'],
    gold: 25,
    inventory: [I['pocao-cura']],
    equipment: { weapon: I['espada-longa'], offhand: I['escudo-aco'], armor: I['cota-malha'], head: I['elmo-aco'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '⚔️',
  },
  {
    name: 'Seraphina Luzéterna',
    class: 'paladino',
    race: 'anao',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 4, current: 4, max: 4 },
    habilidade: { base: 2, current: 2, max: 2 },
    resistencia:{ base: 4, current: 4, max: 4 },
    armadura: 5,
    poderFogo:  { base: 3, current: 3, max: 3 },
    pontosVida: { base: 20, current: 20, max: 20 },
    pontosMana: { base: 12, current: 12, max: 12 },
    vantagens: ['Golpe Divino', 'Imposição de Mãos', 'Aura de Proteção', 'Resistência Anã'],
    desvantagens: ['Código de Honra'],
    gold: 30,
    inventory: [I['pocao-cura'], I['pocao-cura']],
    equipment: { weapon: I['martelo-sagrado'], offhand: I['escudo-bento'], head: I['elmo-sagrado'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🛡️',
  },
  // ── DPS ──────────────────────────────────────────────────────────────────
  {
    name: 'Sable das Sete Facas',
    class: 'ladino',
    race: 'goblin',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 2, current: 2, max: 2 },
    habilidade: { base: 5, current: 5, max: 5 },
    resistencia:{ base: 2, current: 2, max: 2 },
    armadura: 3,
    poderFogo:  { base: 1, current: 1, max: 1 },
    pontosVida: { base: 10, current: 10, max: 10 },
    pontosMana: { base: 4, current: 4, max: 4 },
    vantagens: ['Ataque Furtivo', 'Furtividade Profissional', 'Oportunista'],
    desvantagens: ['Desconfiado', 'Frágil'],
    gold: 60,
    inventory: [I['pocao-cura'], I['pocao-cura']],
    equipment: { weapon: I['espada-curta'], gloves: I['luvas-couro'], ring_left: I['anel-habilidade'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🗡️',
  },
  {
    name: 'Kael Olho-de-Falcão',
    class: 'ranger',
    race: 'meio-elfo',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 2, current: 2, max: 2 },
    habilidade: { base: 5, current: 5, max: 5 },
    resistencia:{ base: 3, current: 3, max: 3 },
    armadura: 3,
    poderFogo:  { base: 4, current: 4, max: 4 },
    pontosVida: { base: 15, current: 15, max: 15 },
    pontosMana: { base: 9, current: 9, max: 9 },
    vantagens: ['Tiro Certeiro', 'Rastreamento', 'Herança Dual'],
    desvantagens: ['Solitário'],
    gold: 35,
    inventory: [I['pocao-cura']],
    equipment: { weapon: I['arco-longo'], armor: I['gibao-couro'], boots: I['botas-velocidade'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🏹',
  },
  {
    name: 'Tenza da Montanha',
    class: 'monge',
    race: 'halfling',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 2, current: 2, max: 2 },
    habilidade: { base: 5, current: 5, max: 5 },
    resistencia:{ base: 2, current: 2, max: 2 },
    armadura: 2,
    poderFogo:  { base: 4, current: 4, max: 4 },
    pontosVida: { base: 10, current: 10, max: 10 },
    pontosMana: { base: 6, current: 6, max: 6 },
    vantagens: ['Ataque Desarmado', 'Armadura de Ki', 'Sorte de Halfling'],
    desvantagens: ['Código de Honra'],
    gold: 20,
    inventory: [I['pocao-cura'], I['pocao-cura']],
    equipment: { ring_left: I['anel-forca'], boots: I['botas-velocidade'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '👊',
  },
  // ── HEALERS ──────────────────────────────────────────────────────────────
  {
    name: 'Brynn Coração-de-Luz',
    class: 'clerigo',
    race: 'humano',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 2, current: 2, max: 2 },
    habilidade: { base: 3, current: 3, max: 3 },
    resistencia:{ base: 4, current: 4, max: 4 },
    armadura: 3,
    poderFogo:  { base: 5, current: 5, max: 5 },
    pontosVida: { base: 20, current: 20, max: 20 },
    pontosMana: { base: 16, current: 16, max: 16 },
    vantagens: ['Cura Divina', 'Expulsar Mortos-Vivos', 'Versatilidade Humana'],
    desvantagens: ['Obrigação (Igreja de Khalmyr)'],
    gold: 20,
    inventory: [I['pocao-cura'], I['pocao-cura'], I['pocao-mana']],
    equipment: { weapon: I['martelo-sagrado'], armor: I['vestes-arcanas'], head: I['chapeu-mago'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🌟',
  },
  {
    name: 'Zara da Floresta Profunda',
    class: 'druida',
    race: 'elfo',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 1, current: 1, max: 1 },
    habilidade: { base: 4, current: 4, max: 4 },
    resistencia:{ base: 4, current: 4, max: 4 },
    armadura: 2,
    poderFogo:  { base: 5, current: 5, max: 5 },
    pontosVida: { base: 20, current: 20, max: 20 },
    pontosMana: { base: 16, current: 16, max: 16 },
    vantagens: ['Forma Animal', 'Magia Natural', 'Sentidos Élficos'],
    desvantagens: ['Juramento da Natureza'],
    gold: 15,
    inventory: [I['pocao-cura'], I['pocao-cura'], I['pocao-mana']],
    equipment: { weapon: I['cajado-arcano'], armor: I['manto-druida'], ring_left: I['anel-protecao'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🌿',
  },
  // ── MAGES ────────────────────────────────────────────────────────────────
  {
    name: 'Lyranth das Sombras',
    class: 'mago',
    race: 'lefou',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 1, current: 1, max: 1 },
    habilidade: { base: 4, current: 4, max: 4 },
    resistencia:{ base: 3, current: 3, max: 3 },
    armadura: 1,
    poderFogo:  { base: 5, current: 5, max: 5 },
    pontosVida: { base: 15, current: 15, max: 15 },
    pontosMana: { base: 15, current: 15, max: 15 },
    vantagens: ['Arcano Avançado', 'Conjuração Aprimorada', 'Visão nas Trevas'],
    desvantagens: ['Marca do Mal'],
    gold: 25,
    inventory: [I['pocao-cura'], I['pocao-mana'], I['pergaminho-fogo']],
    equipment: { weapon: I['cajado-arcano'], armor: I['vestes-arcanas'], head: I['chapeu-mago'], gloves: I['luvas-mago'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🔮',
  },
  {
    name: 'Vesper Malandrin',
    class: 'bardo',
    race: 'gnomo',
    level: 1, xp: 0, xpToNextLevel: 100,
    forca:      { base: 1, current: 1, max: 1 },
    habilidade: { base: 5, current: 5, max: 5 },
    resistencia:{ base: 3, current: 3, max: 3 },
    armadura: 2,
    poderFogo:  { base: 5, current: 5, max: 5 },
    pontosVida: { base: 15, current: 15, max: 15 },
    pontosMana: { base: 12, current: 12, max: 12 },
    vantagens: ['Inspiração Bardística', 'Jack of All Trades', 'Ilusionista Nato'],
    desvantagens: ['Curioso Demais'],
    gold: 45,
    inventory: [I['pocao-cura'], I['pocao-cura'], I['pocao-mana']],
    equipment: { weapon: I['espada-curta'], armor: I['vestes-arcanas'], ring_left: I['anel-poder'] },
    statusEffects: [], levelUpPoints: 0, portraitIcon: '🎵',
  },
];

export const LEGENDARY_CHARACTERS = PRESET_CHARACTERS;

// Pool de companheiros = os mesmos personagens lendários marcados como isCompanion
export const COMPANION_POOL: Omit<Character, 'id'>[] = PRESET_CHARACTERS.map(c => ({ ...c, isCompanion: true }));

export const CLASS_ICONS: Record<CharacterClass, string> = {
  guerreiro: '⚔️',
  mago: '🔮',
  ladino: '🗡️',
  clerigo: '🌟',
  ranger: '🏹',
  bardo: '🎵',
  druida: '🌿',
  paladino: '🛡️',
  barbaro: '🪓',
  monge: '👊',
};

export const CLASS_COLORS: Record<CharacterClass, string> = {
  guerreiro: '#c0392b',
  mago: '#8e44ad',
  ladino: '#2c3e50',
  clerigo: '#f39c12',
  ranger: '#16a085',
  bardo: '#e67e22',
  druida: '#27ae60',
  paladino: '#2980b9',
  barbaro: '#a04020',
  monge: '#d4a017',
};
