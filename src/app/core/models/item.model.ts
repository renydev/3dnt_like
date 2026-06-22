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

export interface StatBonus {
  forca?:       number;
  habilidade?:  number;
  resistencia?: number;
  armadura?:    number;
  poderFogo?:   number;
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
  forca:       number;
  habilidade:  number;
  resistencia: number;
  armadura:    number;
  poderFogo:   number;
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
    if (s.forca)       b.forca       = (b.forca       ?? 0) + s.forca;
    if (s.habilidade)  b.habilidade  = (b.habilidade  ?? 0) + s.habilidade;
    if (s.resistencia) b.resistencia = (b.resistencia ?? 0) + s.resistencia;
    if (s.armadura)    b.armadura    = (b.armadura    ?? 0) + s.armadura;
    if (s.poderFogo)   b.poderFogo   = (b.poderFogo   ?? 0) + s.poderFogo;
    if (s.pontosVida)  b.pontosVida  = (b.pontosVida  ?? 0) + s.pontosVida;
    if (s.pontosMana)  b.pontosMana  = (b.pontosMana  ?? 0) + s.pontosMana;
  }
  return b;
}

export function getEffectiveStats(char: Character): EffectiveStats {
  const eq = char.equipment ?? {};
  const b = mergeBonus(...allEquipItems(eq));
  return {
    forca:       char.forca.current       + (b.forca       ?? 0),
    habilidade:  char.habilidade.current  + (b.habilidade  ?? 0),
    resistencia: char.resistencia.current + (b.resistencia ?? 0),
    armadura:    char.armadura            + (b.armadura    ?? 0),
    poderFogo:   char.poderFogo.current   + (b.poderFogo   ?? 0),
  };
}

/**
 * Equipa o Anel de Vitalidade Dupla (PVs Extras x2, +20 PV) no slot livre de
 * anel e soma o bônus ao PV base/atual/máximo. Todo aventureiro — jogador ou
 * companheiro — recebe este anel ao entrar no Labirinto de Valkaria.
 */
export function applyStartingRing<T extends { equipment: Equipment; pontosVida: { base: number; current: number; max: number } }>(char: T): T {
  const ring = ITEM_CATALOG['anel-vitalidade-dupla'];
  const bonus = ring.statBonus?.pontosVida ?? 0;
  const eq = char.equipment ?? {};
  const targetSlot: EquipSlot = !eq.ring_left ? 'ring_left' : !eq.ring_right ? 'ring_right' : 'ring_right';

  return {
    ...char,
    equipment: { ...eq, [targetSlot]: eq[targetSlot] ?? ring },
    pontosVida: {
      base:    char.pontosVida.base    + bonus,
      current: char.pontosVida.current + bonus,
      max:     char.pontosVida.max     + bonus,
    },
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
  if (b.forca)       parts.push(`${b.forca > 0 ? '+' : ''}${b.forca}F`);
  if (b.habilidade)  parts.push(`${b.habilidade > 0 ? '+' : ''}${b.habilidade}H`);
  if (b.resistencia) parts.push(`${b.resistencia > 0 ? '+' : ''}${b.resistencia}R`);
  if (b.armadura)    parts.push(`${b.armadura > 0 ? '+' : ''}${b.armadura}A`);
  if (b.poderFogo)   parts.push(`${b.poderFogo > 0 ? '+' : ''}${b.poderFogo}PF`);
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
    category: 'equipment', slot: 'weapon', rarity: 'common',
    description: 'Espada leve e confiável. +1 Força.',
    statBonus: { forca: 1 },
  },
  'espada-longa': {
    id: 'espada-longa', name: 'Espada Longa', icon: '⚔️',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon',
    description: 'Espada equilibrada de dois gumes. +2 Força.',
    statBonus: { forca: 2 },
  },
  'espada-encantada': {
    id: 'espada-encantada', name: 'Espada Encantada', icon: '✨',
    category: 'equipment', slot: 'weapon', rarity: 'rare',
    description: 'Lâmina imbuída com magia arcana. +2 Força e +1 Habilidade.',
    statBonus: { forca: 2, habilidade: 1 },
  },
  'martelo-sagrado': {
    id: 'martelo-sagrado', name: 'Martelo Sagrado', icon: '🔨',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon',
    description: 'Maça abençoada. +1 Força e +1 Poder de Fogo.',
    statBonus: { forca: 1, poderFogo: 1 },
  },
  'cajado-arcano': {
    id: 'cajado-arcano', name: 'Cajado Arcano', icon: '🪄',
    category: 'equipment', slot: 'weapon', rarity: 'common',
    description: 'Cajado que amplifica magias. +1 Poder de Fogo e +2 PM.',
    statBonus: { poderFogo: 1, pontosMana: 2 },
  },
  'adaga': {
    id: 'adaga', name: 'Adaga', icon: '🔪',
    category: 'equipment', slot: 'weapon', rarity: 'common',
    description: 'Faca de combate veloz. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },

  // ── ARMAS (duas mãos) — twoHanded bloqueia offhand ───────────────────────────
  'machado-guerra': {
    id: 'machado-guerra', name: 'Machado de Guerra', icon: '🪓',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', twoHanded: true,
    description: 'Machado pesado de duas mãos. +3 Força, −1 Habilidade.',
    statBonus: { forca: 3, habilidade: -1 },
  },
  'arco-curto': {
    id: 'arco-curto', name: 'Arco Curto', icon: '🏹',
    category: 'equipment', slot: 'weapon', rarity: 'common', twoHanded: true,
    description: 'Arco leve à distância. +1 Poder de Fogo.',
    statBonus: { poderFogo: 1 },
  },
  'arco-longo': {
    id: 'arco-longo', name: 'Arco Longo', icon: '🏹',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', twoHanded: true,
    description: 'Arco de precisão para longas distâncias. +2 Poder de Fogo.',
    statBonus: { poderFogo: 2 },
  },
  'lanca': {
    id: 'lanca', name: 'Lança', icon: '🗡️',
    category: 'equipment', slot: 'weapon', rarity: 'uncommon', twoHanded: true,
    description: 'Lança de haste longa. +1 Força e +1 Habilidade.',
    statBonus: { forca: 1, habilidade: 1 },
  },

  // ── MÃO SECUNDÁRIA: ESCUDOS ───────────────────────────────────────────────────
  'escudo-madeira': {
    id: 'escudo-madeira', name: 'Escudo de Madeira', icon: '🛡️',
    category: 'equipment', slot: 'offhand', rarity: 'common',
    description: 'Escudo básico de madeira. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'escudo-aco': {
    id: 'escudo-aco', name: 'Escudo de Aço', icon: '🛡️',
    category: 'equipment', slot: 'offhand', rarity: 'uncommon',
    description: 'Escudo resistente de aço. +2 Armadura.',
    statBonus: { armadura: 2 },
  },
  'escudo-bento': {
    id: 'escudo-bento', name: 'Escudo Bento', icon: '🛡️',
    category: 'equipment', slot: 'offhand', rarity: 'uncommon',
    description: 'Escudo abençoado por clérigos. +2 Armadura e +1 Poder de Fogo.',
    statBonus: { armadura: 2, poderFogo: 1 },
  },

  // ── ARMADURAS (corpo) ─────────────────────────────────────────────────────────
  'gibao-couro': {
    id: 'gibao-couro', name: 'Gibão de Couro', icon: '🥋',
    category: 'equipment', slot: 'armor', rarity: 'common',
    description: 'Proteção básica de couro. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'cota-malha': {
    id: 'cota-malha', name: 'Cota de Malha', icon: '⛓️',
    category: 'equipment', slot: 'armor', rarity: 'uncommon',
    description: 'Anéis metálicos entrelaçados. +2 Armadura.',
    statBonus: { armadura: 2 },
  },
  'armadura-placas': {
    id: 'armadura-placas', name: 'Armadura de Placas', icon: '🛡️',
    category: 'equipment', slot: 'armor', rarity: 'rare',
    description: 'Proteção máxima em placas de aço. +3 Armadura, −1 Habilidade.',
    statBonus: { armadura: 3, habilidade: -1 },
  },
  'vestes-arcanas': {
    id: 'vestes-arcanas', name: 'Vestes Arcanas', icon: '👘',
    category: 'equipment', slot: 'armor', rarity: 'common',
    description: 'Vestes tecidas com fios mágicos. +3 PM máximo.',
    statBonus: { pontosMana: 3 },
  },
  'manto-druida': {
    id: 'manto-druida', name: 'Manto Druida', icon: '🌿',
    category: 'equipment', slot: 'armor', rarity: 'uncommon',
    description: 'Manto de fibras naturais encantadas. +2 PM e +1 Poder de Fogo.',
    statBonus: { pontosMana: 2, poderFogo: 1 },
  },

  // ── CABEÇA ────────────────────────────────────────────────────────────────────
  'capacete-ferro': {
    id: 'capacete-ferro', name: 'Capacete de Ferro', icon: '⛑️',
    category: 'equipment', slot: 'head', rarity: 'common',
    description: 'Capacete básico de ferro. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'elmo-aco': {
    id: 'elmo-aco', name: 'Elmo de Aço', icon: '⛑️',
    category: 'equipment', slot: 'head', rarity: 'uncommon',
    description: 'Elmo de aço temperado. +2 Armadura.',
    statBonus: { armadura: 2 },
  },
  'chapeu-mago': {
    id: 'chapeu-mago', name: 'Chapéu de Mago', icon: '🧙',
    category: 'equipment', slot: 'head', rarity: 'common',
    description: 'Chapéu pontiagudo que amplifica arcanos. +3 PM.',
    statBonus: { pontosMana: 3 },
  },
  'tiara-elfica': {
    id: 'tiara-elfica', name: 'Tiara Élfica', icon: '👑',
    category: 'equipment', slot: 'head', rarity: 'uncommon',
    description: 'Tiara forjada por elfos. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'elmo-sagrado': {
    id: 'elmo-sagrado', name: 'Elmo Sagrado', icon: '✨',
    category: 'equipment', slot: 'head', rarity: 'rare',
    description: 'Elmo abençoado pelos deuses. +1 Armadura e +1 Poder de Fogo.',
    statBonus: { armadura: 1, poderFogo: 1 },
  },

  // ── LUVAS / MANOPLAS (braços) — exclui anéis ──────────────────────────────────
  'luvas-couro': {
    id: 'luvas-couro', name: 'Luvas de Couro', icon: '🧤',
    category: 'equipment', slot: 'gloves', rarity: 'common',
    description: 'Luvas de couro simples. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'manoplas-ferro': {
    id: 'manoplas-ferro', name: 'Manoplas de Ferro', icon: '🥊',
    category: 'equipment', slot: 'gloves', rarity: 'uncommon',
    description: 'Manoplas de ferro. +1 Armadura e +1 Força.',
    statBonus: { armadura: 1, forca: 1 },
  },
  'luvas-mago': {
    id: 'luvas-mago', name: 'Luvas de Mago', icon: '🧤',
    category: 'equipment', slot: 'gloves', rarity: 'uncommon',
    description: 'Luvas encantadas para conjuradores. +1 Poder de Fogo e +2 PM.',
    statBonus: { poderFogo: 1, pontosMana: 2 },
  },
  'manoplas-sagradas': {
    id: 'manoplas-sagradas', name: 'Manoplas Sagradas', icon: '🥊',
    category: 'equipment', slot: 'gloves', rarity: 'rare',
    description: 'Manoplas abençoadas. +1 Força, +1 Armadura e +1 Poder de Fogo.',
    statBonus: { forca: 1, armadura: 1, poderFogo: 1 },
  },

  // ── BOTAS (pés) ───────────────────────────────────────────────────────────────
  'botas-couro': {
    id: 'botas-couro', name: 'Botas de Couro', icon: '👢',
    category: 'equipment', slot: 'boots', rarity: 'common',
    description: 'Botas de couro resistente. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'botas-velocidade': {
    id: 'botas-velocidade', name: 'Botas de Velocidade', icon: '👟',
    category: 'equipment', slot: 'boots', rarity: 'uncommon',
    description: 'Botas encantadas para movimentos rápidos. +2 Habilidade.',
    statBonus: { habilidade: 2 },
  },
  'botas-ferro': {
    id: 'botas-ferro', name: 'Botas de Ferro', icon: '👢',
    category: 'equipment', slot: 'boots', rarity: 'uncommon',
    description: 'Botas reforçadas com placas de ferro. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'botas-mago': {
    id: 'botas-mago', name: 'Botas de Mago', icon: '👟',
    category: 'equipment', slot: 'boots', rarity: 'rare',
    description: 'Botas para conjuradores. +2 PM e +1 Poder de Fogo.',
    statBonus: { pontosMana: 2, poderFogo: 1 },
  },

  // ── ANÉIS (dedos) — um por mão, exclui luvas ──────────────────────────────────
  'anel-habilidade': {
    id: 'anel-habilidade', name: 'Anel de Habilidade', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'uncommon',
    description: 'Anel que afina os reflexos. +1 Habilidade.',
    statBonus: { habilidade: 1 },
  },
  'anel-fortuna': {
    id: 'anel-fortuna', name: 'Anel da Fortuna', icon: '🍀',
    category: 'equipment', slot: 'ring', rarity: 'rare',
    description: 'Anel lendário que aguça mente e magia. +1 Habilidade e +1 Poder de Fogo.',
    statBonus: { habilidade: 1, poderFogo: 1 },
  },
  'anel-protecao': {
    id: 'anel-protecao', name: 'Anel de Proteção', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'common',
    description: 'Anel com barreira mágica. +1 Armadura.',
    statBonus: { armadura: 1 },
  },
  'anel-forca': {
    id: 'anel-forca', name: 'Anel de Força', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'common',
    description: 'Anel encantado que amplifica a força. +1 Força.',
    statBonus: { forca: 1 },
  },
  'anel-poder': {
    id: 'anel-poder', name: 'Anel de Poder', icon: '🌟',
    category: 'equipment', slot: 'ring', rarity: 'common',
    description: 'Anel que potencializa ataques mágicos. +1 Poder de Fogo.',
    statBonus: { poderFogo: 1 },
  },
  'anel-resistencia': {
    id: 'anel-resistencia', name: 'Anel de Resistência', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'uncommon',
    description: 'Anel que fortalece o corpo. +1 Resistência e +5 PV.',
    statBonus: { resistencia: 1, pontosVida: 5 },
  },
  'anel-sabedoria': {
    id: 'anel-sabedoria', name: 'Anel de Sabedoria', icon: '💫',
    category: 'equipment', slot: 'ring', rarity: 'uncommon',
    description: 'Anel que expande a reserva mágica. +3 PM.',
    statBonus: { pontosMana: 3 },
  },
  'anel-vitalidade-dupla': {
    id: 'anel-vitalidade-dupla', name: 'Anel de Vitalidade Dupla', icon: '💍',
    category: 'equipment', slot: 'ring', rarity: 'rare',
    description: 'Anel concedido a todo aventureiro que entra no Labirinto de Valkaria. Carrega a Vantagem PVs Extras duas vezes. +20 PV.',
    vantagemBonus: ['PVs Extras', 'PVs Extras'],
    statBonus: { pontosVida: 20 },
  },

  // ── CONSUMÍVEIS ───────────────────────────────────────────────────────────────
  'pocao-cura': {
    id: 'pocao-cura', name: 'Poção de Cura', icon: '🧪',
    category: 'consumable', rarity: 'common',
    description: 'Líquido vermelho que restaura vitalidade. Cura 1d6+2 PV.',
    healPvDice: 1, healPvFlat: 2, usableInCombat: true,
  },
  'pocao-cura-maior': {
    id: 'pocao-cura-maior', name: 'Poção de Cura Maior', icon: '🧪',
    category: 'consumable', rarity: 'uncommon',
    description: 'Poção concentrada de alta potência. Cura 2d6+4 PV.',
    healPvDice: 2, healPvFlat: 4, usableInCombat: true,
  },
  'pocao-mana': {
    id: 'pocao-mana', name: 'Poção de Mana', icon: '🔵',
    category: 'consumable', rarity: 'common',
    description: 'Elixir azulado que restaura energia mágica. Recupera 1d6+2 PM.',
    healPmDice: 1, healPmFlat: 2, usableInCombat: true,
  },
  'elixir-vigor': {
    id: 'elixir-vigor', name: 'Elixir de Vigor', icon: '💛',
    category: 'consumable', rarity: 'rare',
    description: 'Elixir lendário de recuperação total. Restaura todos os PV.',
    healPvDice: 0, healPvFlat: 999, usableInCombat: true,
  },
  'pergaminho-fogo': {
    id: 'pergaminho-fogo', name: 'Pergaminho de Fogo', icon: '📜',
    category: 'consumable', rarity: 'uncommon',
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

function pickFrom(arr: string[]): Item {
  return ITEM_CATALOG[arr[Math.floor(Math.random() * arr.length)]];
}

/** Sorteia um item aleatório para recompensa de tesouro, ponderado pelo andar. */
export function rollTreasureItem(floor: number): Item {
  const rareChance     = Math.min(0.10 + floor * 0.02, 0.35);
  const uncommonChance = Math.min(0.30 + floor * 0.02, 0.55);
  const roll = Math.random();

  if (roll < rareChance) {
    const pool = [
      ...RARE_WEAPONS, ...RARE_ARMOR, ...RARE_HEAD,
      ...RARE_GLOVES, ...RARE_BOOTS, ...RARE_RINGS, ...RARE_CONSUME,
    ];
    return pickFrom(pool);
  }
  if (roll < rareChance + uncommonChance) {
    const pool = [
      ...UNCOMMON_WEAPONS, ...UNCOMMON_OFFHAND, ...UNCOMMON_ARMOR,
      ...UNCOMMON_HEAD, ...UNCOMMON_GLOVES, ...UNCOMMON_BOOTS,
      ...UNCOMMON_RINGS, ...UNCOMMON_CONSUME,
    ];
    return pickFrom(pool);
  }
  if (Math.random() < 0.4) return pickFrom(COMMON_CONSUME);
  const pool = [
    ...COMMON_WEAPONS, ...COMMON_OFFHAND, ...COMMON_ARMOR,
    ...COMMON_HEAD, ...COMMON_GLOVES, ...COMMON_BOOTS, ...COMMON_RINGS,
  ];
  return pickFrom(pool);
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
