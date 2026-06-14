export type CharacterClass =
  | 'guerreiro' | 'mago' | 'ladino' | 'clerigo' | 'ranger'
  | 'bardo' | 'druida' | 'paladino' | 'barbaro' | 'monge';

export type CharacterRace =
  | 'humano' | 'elfo' | 'anao' | 'halfling' | 'gnomo'
  | 'meio-elfo' | 'meio-orc' | 'lefou' | 'minotauro' | 'goblin';

export type CharacterRole = 'tank' | 'dps' | 'healer' | 'mage';

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

  // Vantagens/Desvantagens/Perícias
  vantagens: string[];
  desvantagens: string[];
  pericias?: string[]; // IDs das perícias compradas (cada uma custa 3 pts)

  // Estado
  gold: number;
  items: string[];
  statusEffects: StatusEffect[];

  // Modificadores raciais (separados da base para cálculo correto de custo)
  racialMods?: Partial<Record<'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'poderFogo', number>>;

  // Evolução — pontos disponíveis para gastar em atributos
  levelUpPoints?: number;

  // Metadados visuais
  isCompanion?: boolean;
  portraitIcon?: string; // emoji ou caminho de asset
}

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
    vantagens: ['Fúria Bárbara', 'Alma Primitiva', 'Chifrada'],
    desvantagens: ['Instinto Bestial'],
    gold: 15, items: ['Machado de Guerra', 'Poção de Cura x2'],
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
    vantagens: ['Ataque Duplo', 'Especialização em Arma', 'Implacável'],
    desvantagens: ['Má Fama'],
    gold: 25, items: ['Espada Bastarda', 'Armadura de Cota', 'Poção de Cura'],
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
    vantagens: ['Golpe Divino', 'Imposição de Mãos', 'Aura de Proteção', 'Resistência Anã'],
    desvantagens: ['Código de Honra'],
    gold: 30, items: ['Martelo Sagrado', 'Escudo Bento', 'Poção de Cura x2'],
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
    vantagens: ['Ataque Furtivo', 'Furtividade Profissional', 'Oportunista'],
    desvantagens: ['Desconfiado', 'Frágil'],
    gold: 60, items: ['Adaga Envenenada x3', 'Ferramentas de Ladrão', 'Poção de Cura'],
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
    vantagens: ['Tiro Certeiro', 'Rastreamento', 'Herança Dual'],
    desvantagens: ['Solitário'],
    gold: 35, items: ['Arco Longo +1', 'Aljava (30 flechas)', 'Poção de Cura'],
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
    vantagens: ['Ataque Desarmado', 'Armadura de Ki', 'Sorte de Halfling'],
    desvantagens: ['Código de Honra'],
    gold: 20, items: ['Faixa de Ki', 'Poção de Cura x2'],
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
    vantagens: ['Cura Divina', 'Expulsar Mortos-Vivos', 'Versatilidade Humana'],
    desvantagens: ['Obrigação (Igreja de Khalmyr)'],
    gold: 20, items: ['Maça Sagrada', 'Símbolo Divino', 'Poção de Cura x3'],
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
    vantagens: ['Forma Animal', 'Magia Natural', 'Sentidos Élficos'],
    desvantagens: ['Juramento da Natureza'],
    gold: 15, items: ['Cajado de Carvalho', 'Ervas Curativas x3', 'Poção de Cura x2'],
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
    vantagens: ['Arcano Avançado', 'Conjuração Aprimorada', 'Visão nas Trevas'],
    desvantagens: ['Marca do Mal'],
    gold: 25, items: ['Cajado Sombrio', 'Grimório Proibido', 'Poção de PF x2', 'Poção de Cura'],
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
    vantagens: ['Inspiração Bardística', 'Jack of All Trades', 'Ilusionista Nato'],
    desvantagens: ['Curioso Demais'],
    gold: 45, items: ['Alaúde Mágico', 'Adaga da Fortuna', 'Poção de PF', 'Poção de Cura x2'],
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
