import { Character } from './character.model';

export type ItemCategory = 'equipment' | 'consumable';

/** Slot no item (ring = qualquer dedo; ring_left/ring_right são slots reais no Equipment) */
export type ItemSlot =
  | 'weapon'   // arma (uma mão)
  | 'offhand'  // mão secundária: escudo ou arma sec.
  | 'armor'    // armadura (corpo)
  | 'head'     // cabeça: capacete / chapéu / tiara
  | 'gloves'   // luvas / manoplas (braços) — exclui anéis
  | 'boots'    // botas (pés)
  | 'ring';    // anel (atribuído a ring_left ou ring_right)

/** Chaves reais no objeto Equipment */
export type EquipSlot =
  | 'weapon' | 'offhand' | 'armor' | 'head'
  | 'gloves' | 'boots' | 'ring_left' | 'ring_right';

export type ItemRarity = 'common' | 'uncommon' | 'rare';

/**
 * No 3D&T Victory, Armadura não é um atributo comprado com PP — é uma qualidade
 * de equipamento (artefato). Por isso `armadura` aqui é só um bônus de item,
 * somado à Resistência no teste de defesa.
 */
export interface StatBonus {
  poder?:       number;
  habilidade?:  number;
  resistencia?: number;
  armadura?:    number;
  pontosVida?:  number;
  pontosMana?:  number;
}

export interface Item {
  id:              string;
  name:            string;
  icon:            string;
  category:        ItemCategory;
  slot?:           ItemSlot;         // undefined = consumível sem slot
  rarity:          ItemRarity;
  description:     string;
  twoHanded?:      boolean;          // armas de 2 mãos bloqueiam o offhand
  price?:          number;
  statBonus?:      StatBonus;
  vantagemBonus?:  string[];
  periciaBonus?:   string[];
  healPvDice?:     number;
  healPvFlat?:     number;
  healPmDice?:     number;
  healPmFlat?:     number;
  damageDice?:     number;
  usableInCombat?: boolean;
  usableOutside?:  boolean;
  /** Faixa de andares [min, max] onde o item pode aparecer como tesouro — evita
   *  item fraco de andar 20 ou item forte demais no andar 1. Sem isso, disponível em qualquer andar. */
  floorRange?:     [number, number];
}

export interface Equipment {
  weapon?:     Item;   // arma (uma mão)
  offhand?:    Item;   // mão secundária: escudo / arma sec.
  armor?:      Item;   // armadura (corpo)
  head?:       Item;   // cabeça
  gloves?:     Item;   // luvas / manoplas (braços)
  boots?:      Item;   // botas (pés)
  ring_left?:  Item;   // anel mão esquerda
  ring_right?: Item;   // anel mão direita
}

export interface EffectiveStats {
  poder:       number;
  habilidade:  number;
  resistencia: number;
  armadura:    number;
}

// ── Utilitários ────────────────────────────────────────────────────────────────

export function allEquipItems(eq: Equipment): (Item | undefined)[] {
  return [eq.weapon, eq.offhand, eq.armor, eq.head, eq.gloves, eq.boots, eq.ring_left, eq.ring_right];
}

export function mergeBonus(...items: (Item | undefined)[]): StatBonus {
  const b: StatBonus = {};
  for (const item of items) {
    if (!item?.statBonus) continue;
    const s = item.statBonus;
    if (s.poder)       b.poder       = (b.poder       ?? 0) + s.poder;
    if (s.habilidade)  b.habilidade  = (b.habilidade  ?? 0) + s.habilidade;
    if (s.resistencia) b.resistencia = (b.resistencia ?? 0) + s.resistencia;
    if (s.armadura)    b.armadura    = (b.armadura    ?? 0) + s.armadura;
    if (s.pontosVida)  b.pontosVida  = (b.pontosVida  ?? 0) + s.pontosVida;
    if (s.pontosMana)  b.pontosMana  = (b.pontosMana  ?? 0) + s.pontosMana;
  }
  return b;
}

export function getEffectiveStats(char: Character): EffectiveStats {
  const eq = char.equipment ?? {};
  const b = mergeBonus(...allEquipItems(eq));
  return {
    poder:       char.poder.current       + (b.poder       ?? 0),
    habilidade:  char.habilidade.current  + (b.habilidade  ?? 0),
    resistencia: char.resistencia.current + (b.resistencia ?? 0),
    armadura:    (b.armadura ?? 0), // Armadura é 100% equipamento — sem base no personagem
  };
}

export function equipSlotLabel(slot: string): string {
  const labels: Record<string, string> = {
    weapon: 'Arma', offhand: 'Mão Sec.', armor: 'Armadura',
    head: 'Cabeça', gloves: 'Luvas', boots: 'Botas',
    ring: 'Anel', ring_left: 'Anel Esq.', ring_right: 'Anel Dir.',
  };
  return labels[slot] ?? slot;
}

export function statBonusLabel(b: StatBonus): string {
  const parts: string[] = [];
  if (b.poder)       parts.push(`${b.poder > 0 ? '+' : ''}${b.poder}P`);
  if (b.habilidade)  parts.push(`${b.habilidade > 0 ? '+' : ''}${b.habilidade}H`);
  if (b.resistencia) parts.push(`${b.resistencia > 0 ? '+' : ''}${b.resistencia}R`);
  if (b.armadura)    parts.push(`${b.armadura > 0 ? '+' : ''}${b.armadura}A`);
  if (b.pontosVida)  parts.push(`${b.pontosVida > 0 ? '+' : ''}${b.pontosVida}PV`);
  if (b.pontosMana)  parts.push(`${b.pontosMana > 0 ? '+' : ''}${b.pontosMana}PM`);
  return parts.join(' ') || '';
}

export function rarityLabel(r: ItemRarity): string {
  return r === 'rare' ? 'Raro' : r === 'uncommon' ? 'Incomum' : 'Comum';
}

export function rarityColor(r: ItemRarity): string {
  return r === 'rare' ? '#c084fc' : r === 'uncommon' ? '#60a5fa' : '#9ca3af';
}

// ── Catálogo de Itens ──────────────────────────────────────────────────────────

export const ITEM_CATALOG: Record<string, Item> = {

  // ── ARMAS (uma mão) ───────────────────────────────────────────────────────────
  'espada-curta': {
    id: 'espada-curta', name: 'Espada Curta', icon: '🗡️',
    category: 'equipment', slot: 'weapon', rarity: 'common', floorRange: [1, 7],
    description: 'Espada leve e confiável. +1 Poder.',
    statBonus: { poder: 1 },
  },
  'espada-longa': {
    id: 'espada-longa', name: 'Espada Longa', icon: '⚔️',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Espada equilibrada de dois gumes. +2 Poder.',
    statBonus: { poder: 2 },
  },
  'espada-encantada': {
    id: 'espada-encantada', name: 'Espada Encantada', icon: '✨',
    category: 'equipment', slot: 'weapon', rarity: 'rare', floorRange: [12, 20],
    description: 'Lâmina imbuída com magia arcana. +2 Poder e +1 Habilidade.',
    statBonus: { poder: 2, habilidade: 1 },
  },
  'martelo-sagrado': {
    id: 'martelo-sagrado', name: 'Martelo Sagrado', icon: '🔨',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Maça abençoada. +2 Poder.',
    statBonus: { poder: 2 },
  },
  'cajado-arcano': {
    id: 'cajado-arcano', name: 'Cajado Arcano', icon: '🪄',
    category: 'equipment', slot: 'weapon', rarity: 'common', floorRange: [1, 7],
    description: 'Cajado que amplifica magias. +1 Poder e +2 PM.',
    statBonus: { poder: 1, pontosMana: 2 },
  },
  'adaga': {
    id: 'adaga', name: 'Adaga', icon: '🔪',
    category: 'equipment', slot: 'weapon', rarity: 'common', floorRange: [1, 7],
    description: 'Faca de combate veloz. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },

  // ── ARMAS (duas mãos) — twoHanded bloqueia offhand ───────────────────────────
  'machado-guerra': {
    id: 'machado-guerra', name: 'Machado de Guerra', icon: '🪓',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', floorRange: [5, 15], twoHanded: true,
    description: 'Machado pesado de duas mãos. +3 Poder, −1 Habilidade.',
    statBonus: { poder: 3, habilidade: -1 },
  },
  'arco-curto': {
    id: 'arco-curto', name: 'Arco Curto', icon: '🏹',
    category: 'equipment', slot: 'weapon', rarity: 'common', floorRange: [1, 7], twoHanded: true,
    description: 'Arco leve à distância. +1 Poder.',
    statBonus: { poder: 1 },
  },
  'arco-longo': {
    id: 'arco-longo', name: 'Arco Longo', icon: '🏹',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', floorRange: [5, 15], twoHanded: true,
    description: 'Arco de precisão para longas distâncias. +2 Poder.',
    statBonus: { poder: 2 },
  },
  'lanca': {
    id: 'lanca', name: 'Lança', icon: '🗡️',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', floorRange: [5, 15], twoHanded: true,
    description: 'Lança de haste longa. +1 Poder e +1 Habilidade.',
    statBonus: { poder: 1, habilidade: 1 },
  },

  // ── MÃO SECUNDÁRIA: ESCUDOS ───────────────────────────────────────────────────
  'escudo-madeira': {
    id: 'escudo-madeira', name: 'Escudo de Madeira', icon: '🛡️',
    category: 'equipment', slot: 'offhand', rarity: 'common', floorRange: [1, 7],
    description: 'Escudo básico de madeira. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'escudo-aco': {
    id: 'escudo-aco', name: 'Escudo de Aço', icon: '🛡️',
    category: 'equipment', slot: 'offhand', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Escudo resistente de aço. +2 Armadura.',
    statBonus: { armadura: 2 },
  },
  'escudo-bento': {
    id: 'escudo-bento', name: 'Escudo Bento', icon: '🛡️',
    category: 'equipment', slot: 'offhand', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Escudo abençoado por clérigos. +2 Armadura e +1 Poder.',
    statBonus: { armadura: 2, poder: 1 },
  },

  // ── ARMADURAS (corpo) ─────────────────────────────────────────────────────────
  'gibao-couro': {
    id: 'gibao-couro', name: 'Gibão de Couro', icon: '🥋',
    category: 'equipment', slot: 'armor', rarity: 'common', floorRange: [1, 7],
    description: 'Proteção básica de couro. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'cota-malha': {
    id: 'cota-malha', name: 'Cota de Malha', icon: '⛓️',
    category: 'equipment', slot: 'armor', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Anéis metálicos entrelaçados. +2 Armadura.',
    statBonus: { armadura: 2 },
  },
  'armadura-placas': {
    id: 'armadura-placas', name: 'Armadura de Placas', icon: '🛡️',
    category: 'equipment', slot: 'armor', rarity: 'rare', floorRange: [12, 20],
    description: 'Proteção máxima em placas de aço. +3 Armadura, −1 Habilidade.',
    statBonus: { armadura: 3, habilidade: -1 },
  },
  'vestes-arcanas': {
    id: 'vestes-arcanas', name: 'Vestes Arcanas', icon: '👘',
    category: 'equipment', slot: 'armor', rarity: 'common', floorRange: [1, 7],
    description: 'Vestes tecidas com fios mágicos. +3 PM máximo.',
    statBonus: { pontosMana: 3 },
  },
  'manto-druida': {
    id: 'manto-druida', name: 'Manto Druida', icon: '🌿',
    category: 'equipment', slot: 'armor', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Manto de fibras naturais encantadas. +2 PM e +1 Poder.',
    statBonus: { pontosMana: 2, poder: 1 },
  },

  // ── CABEÇA ────────────────────────────────────────────────────────────────────
  'capacete-ferro': {
    id: 'capacete-ferro', name: 'Capacete de Ferro', icon: '⛑️',
    category: 'equipment', slot: 'head', rarity: 'common', floorRange: [1, 7],
    description: 'Capacete básico de ferro. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'elmo-aco': {
    id: 'elmo-aco', name: 'Elmo de Aço', icon: '⛑️',
    category: 'equipment', slot: 'head', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Elmo de aço temperado. +2 Armadura.',
    statBonus: { armadura: 2 },
  },
  'chapeu-mago': {
    id: 'chapeu-mago', name: 'Chapéu de Mago', icon: '🧙',
    category: 'equipment', slot: 'head', rarity: 'common', floorRange: [1, 7],
    description: 'Chapéu pontiagudo que amplifica arcanos. +3 PM.',
    statBonus: { pontosMana: 3 },
  },
  'tiara-elfica': {
    id: 'tiara-elfica', name: 'Tiara Élfica', icon: '👑',
    category: 'equipment', slot: 'head', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Tiara forjada por elfos. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'elmo-sagrado': {
    id: 'elmo-sagrado', name: 'Elmo Sagrado', icon: '✨',
    category: 'equipment', slot: 'head', rarity: 'rare', floorRange: [12, 20],
    description: 'Elmo abençoado pelos deuses. +1 Armadura e +1 Poder.',
    statBonus: { armadura: 1, poder: 1 },
  },

  // ── LUVAS / MANOPLAS (braços) — exclui anéis ──────────────────────────────────
  'luvas-couro': {
    id: 'luvas-couro', name: 'Luvas de Couro', icon: '🧤',
    category: 'equipment', slot: 'gloves', rarity: 'common', floorRange: [1, 7],
    description: 'Luvas de couro simples. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'manoplas-ferro': {
    id: 'manoplas-ferro', name: 'Manoplas de Ferro', icon: '🥊',
    category: 'equipment', slot: 'gloves', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Manoplas de ferro. +1 Armadura e +1 Poder.',
    statBonus: { armadura: 1, poder: 1 },
  },
  'luvas-mago': {
    id: 'luvas-mago', name: 'Luvas de Mago', icon: '🧤',
    category: 'equipment', slot: 'gloves', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Luvas encantadas para conjuradores. +1 Poder e +2 PM.',
    statBonus: { poder: 1, pontosMana: 2 },
  },
  'manoplas-sagradas': {
    id: 'manoplas-sagradas', name: 'Manoplas Sagradas', icon: '🥊',
    category: 'equipment', slot: 'gloves', rarity: 'rare', floorRange: [12, 20],
    description: 'Manoplas abençoadas. +2 Poder e +1 Armadura.',
    statBonus: { poder: 2, armadura: 1 },
  },

  // ── BOTAS (pés) ───────────────────────────────────────────────────────────────
  'botas-couro': {
    id: 'botas-couro', name: 'Botas de Couro', icon: '👢',
    category: 'equipment', slot: 'boots', rarity: 'common', floorRange: [1, 7],
    description: 'Botas de couro resistente. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'botas-velocidade': {
    id: 'botas-velocidade', name: 'Botas de Velocidade', icon: '👟',
    category: 'equipment', slot: 'boots', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Botas encantadas para movimentos rápidos. +2 Habilidade.',
    statBonus: { habilidade: 2 },
  },
  'botas-ferro': {
    id: 'botas-ferro', name: 'Botas de Ferro', icon: '👢',
    category: 'equipment', slot: 'boots', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Botas reforçadas com placas de ferro. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'botas-mago': {
    id: 'botas-mago', name: 'Botas de Mago', icon: '👟',
    category: 'equipment', slot: 'boots', rarity: 'rare', floorRange: [12, 20],
    description: 'Botas para conjuradores. +2 PM e +1 Poder.',
    statBonus: { pontosMana: 2, poder: 1 },
  },

  // ── ANÉIS (dedos) — um por mão, exclui luvas ──────────────────────────────────
  'anel-habilidade': {
    id: 'anel-habilidade', name: 'Anel de Habilidade', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Anel que afina os reflexos. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'anel-fortuna': {
    id: 'anel-fortuna', name: 'Anel da Fortuna', icon: '🍀',
    category: 'equipment', slot: 'ring', rarity: 'rare', floorRange: [12, 20],
    description: 'Anel lendário que aguça mente e poder. +1 Habilidade e +1 Poder.',
    statBonus: { habilidade: 1, poder: 1 },
  },
  'anel-protecao': {
    id: 'anel-protecao', name: 'Anel de Proteção', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'common', floorRange: [1, 7],
    description: 'Anel com barreira mágica. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'anel-forca': {
    id: 'anel-forca', name: 'Anel de Força', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'common', floorRange: [1, 7],
    description: 'Anel encantado que amplifica o poder. +1 Poder.',
    statBonus: { poder: 1 },
  },
  'anel-poder': {
    id: 'anel-poder', name: 'Anel de Poder', icon: '🌟',
    category: 'equipment', slot: 'ring', rarity: 'common', floorRange: [1, 7],
    description: 'Anel que potencializa ataques. +1 Poder.',
    statBonus: { poder: 1 },
  },
  'anel-resistencia': {
    id: 'anel-resistencia', name: 'Anel de Resistência', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Anel que fortalece o corpo. +1 Resistência e +5 PV.',
    statBonus: { resistencia: 1, pontosVida: 5 },
  },
  'anel-sabedoria': {
    id: 'anel-sabedoria', name: 'Anel de Sabedoria', icon: '💫',
    category: 'equipment', slot: 'ring', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Anel que expande a reserva mágica. +3 PM.',
    statBonus: { pontosMana: 3 },
  },

  // ── CONSUMÍVEIS ───────────────────────────────────────────────────────────────
  'pocao-cura': {
    id: 'pocao-cura', name: 'Poção de Cura', icon: '🧪',
    category: 'consumable', rarity: 'common', floorRange: [1, 7],
    description: 'Líquido vermelho que restaura vitalidade. Cura 1d6+2 PV.',
    healPvDice: 1, healPvFlat: 2, usableInCombat: true,
  },
  'pocao-cura-maior': {
    id: 'pocao-cura-maior', name: 'Poção de Cura Maior', icon: '🧪',
    category: 'consumable', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Poção concentrada de alta potência. Cura 2d6+4 PV.',
    healPvDice: 2, healPvFlat: 4, usableInCombat: true,
  },
  'pocao-mana': {
    id: 'pocao-mana', name: 'Poção de Mana', icon: '🔵',
    category: 'consumable', rarity: 'common', floorRange: [1, 7],
    description: 'Elixir azulado que restaura energia mágica. Recupera 1d6+2 PM.',
    healPmDice: 1, healPmFlat: 2, usableInCombat: true,
  },
  'elixir-vigor': {
    id: 'elixir-vigor', name: 'Elixir de Vigor', icon: '💛',
    category: 'consumable', rarity: 'rare', floorRange: [12, 20],
    description: 'Elixir lendário de recuperação total. Restaura todos os PV.',
    healPvDice: 0, healPvFlat: 999, usableInCombat: true,
  },
  'pergaminho-fogo': {
    id: 'pergaminho-fogo', name: 'Pergaminho de Fogo', icon: '📜',
    category: 'consumable', rarity: 'uncommon', floorRange: [5, 15],
    description: 'Pergaminho com magia de fogo. Causa 2d6 de dano mágico (ignora armadura).',
    damageDice: 2, usableInCombat: true,
  },
};

export const ALL_ITEMS = Object.values(ITEM_CATALOG);

// ── Tabelas de Loot ────────────────────────────────────────────────────────────

const COMMON_WEAPONS   = ['espada-curta', 'arco-curto', 'cajado-arcano', 'adaga'];
const UNCOMMON_WEAPONS = ['espada-longa', 'machado-guerra', 'arco-longo', 'martelo-sagrado', 'lanca'];
const RARE_WEAPONS     = ['espada-encantada'];

const COMMON_OFFHAND   = ['escudo-madeira'];
const UNCOMMON_OFFHAND = ['escudo-aco', 'escudo-bento'];

const COMMON_ARMOR     = ['gibao-couro', 'vestes-arcanas'];
const UNCOMMON_ARMOR   = ['cota-malha', 'manto-druida'];
const RARE_ARMOR       = ['armadura-placas'];

const COMMON_HEAD      = ['capacete-ferro', 'chapeu-mago'];
const UNCOMMON_HEAD    = ['tiara-elfica', 'elmo-aco'];
const RARE_HEAD        = ['elmo-sagrado'];

const COMMON_GLOVES    = ['luvas-couro'];
const UNCOMMON_GLOVES  = ['manoplas-ferro', 'luvas-mago'];
const RARE_GLOVES      = ['manoplas-sagradas'];

const COMMON_BOOTS     = ['botas-couro'];
const UNCOMMON_BOOTS   = ['botas-velocidade', 'botas-ferro'];
const RARE_BOOTS       = ['botas-mago'];

const COMMON_RINGS     = ['anel-protecao', 'anel-forca', 'anel-poder'];
const UNCOMMON_RINGS   = ['anel-habilidade', 'anel-resistencia', 'anel-sabedoria'];
const RARE_RINGS       = ['anel-fortuna'];

const COMMON_CONSUME   = ['pocao-cura', 'pocao-cura'];
const UNCOMMON_CONSUME = ['pocao-cura-maior', 'pocao-mana', 'pergaminho-fogo'];
const RARE_CONSUME     = ['elixir-vigor'];

/** Item está disponível no andar dado? Sem floorRange = disponível em qualquer andar. */
function inFloorRange(item: Item, floor: number): boolean {
  if (!item.floorRange) return true;
  const [min, max] = item.floorRange;
  return floor >= min && floor <= max;
}

/** Filtra ids para os que existem no catálogo e cabem no andar; null se nenhum sobrar. */
function pickFromIds(ids: string[], floor: number): Item | null {
  const pool = ids
    .map(id => ITEM_CATALOG[id])
    .filter((it): it is Item => !!it && inFloorRange(it, floor));
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

const RARE_IDS = [
  ...RARE_WEAPONS, ...RARE_ARMOR, ...RARE_HEAD,
  ...RARE_GLOVES, ...RARE_BOOTS, ...RARE_RINGS, ...RARE_CONSUME,
];
const UNCOMMON_IDS = [
  ...UNCOMMON_WEAPONS, ...UNCOMMON_OFFHAND, ...UNCOMMON_ARMOR,
  ...UNCOMMON_HEAD, ...UNCOMMON_GLOVES, ...UNCOMMON_BOOTS,
  ...UNCOMMON_RINGS, ...UNCOMMON_CONSUME,
];
const COMMON_IDS = [
  ...COMMON_WEAPONS, ...COMMON_OFFHAND, ...COMMON_ARMOR,
  ...COMMON_HEAD, ...COMMON_GLOVES, ...COMMON_BOOTS, ...COMMON_RINGS, ...COMMON_CONSUME,
];

/** Sorteia um item aleatório para recompensa de tesouro, ponderado pelo andar e
 *  restrito pelo `floorRange` de cada item — evita item fraco demais tarde ou
 *  forte demais cedo na masmorra. Se a faixa sorteada não tiver nada disponível
 *  para este andar específico, cai para a faixa abaixo (sempre há algo: as faixas
 *  de floorRange se sobrepõem o suficiente para cobrir os 20 andares). */
export function rollTreasureItem(floor: number): Item {
  const rareChance     = Math.min(0.10 + floor * 0.02, 0.35);
  const uncommonChance = Math.min(0.30 + floor * 0.02, 0.55);
  const roll = Math.random();

  if (roll < rareChance) {
    return pickFromIds(RARE_IDS, floor) ?? pickFromIds(UNCOMMON_IDS, floor) ?? pickFromIds(COMMON_IDS, floor)!;
  }
  if (roll < rareChance + uncommonChance) {
    return pickFromIds(UNCOMMON_IDS, floor) ?? pickFromIds(COMMON_IDS, floor)!;
  }
  return pickFromIds(COMMON_IDS, floor) ?? pickFromIds(UNCOMMON_IDS, floor)!;
}

/** Itens de início por classe. */
export function getStartingItems(charClass: string): Item[] {
  const potions: Item[] = [ITEM_CATALOG['pocao-cura'], ITEM_CATALOG['pocao-cura']];
  const classItems: Record<string, string[]> = {
    guerreiro: ['espada-longa', 'gibao-couro', 'capacete-ferro'],
    barbaro:   ['machado-guerra', 'botas-couro', 'anel-forca'],
    paladino:  ['martelo-sagrado', 'escudo-bento', 'capacete-ferro'],
    ladino:    ['espada-curta', 'luvas-couro', 'anel-habilidade'],
    ranger:    ['arco-longo', 'gibao-couro', 'botas-velocidade'],
    monge:     ['adaga', 'luvas-couro', 'anel-forca'],
    clerigo:   ['martelo-sagrado', 'vestes-arcanas', 'chapeu-mago'],
    druida:    ['cajado-arcano', 'manto-druida', 'anel-protecao'],
    mago:      ['cajado-arcano', 'vestes-arcanas', 'chapeu-mago'],
    bardo:     ['espada-curta', 'vestes-arcanas', 'anel-poder'],
  };
  const ids = classItems[charClass] ?? ['espada-curta'];
  return [...potions, ...ids.map(id => ITEM_CATALOG[id]).filter(Boolean)];
}
