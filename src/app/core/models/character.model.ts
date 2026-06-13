export type CharacterClass =
  | 'guerreiro' | 'mago' | 'ladino' | 'clerigo' | 'ranger'
  | 'bardo' | 'druida' | 'paladino';

export type CharacterRace =
  | 'humano' | 'elfo' | 'anao' | 'halfling' | 'gnomo'
  | 'meio-elfo' | 'meio-orc' | 'lefou' | 'minotauro' | 'goblin';

export interface Attribute {
  base: number;
  current: number;
  max: number;
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
  pontosMagia: Attribute; // PM - Pontos de Magia

  // PV = R * 5 no 3D&T
  pontosVida: Attribute;

  // Vantagens/Desvantagens
  vantagens: string[];
  desvantagens: string[];

  // Estado
  gold: number;
  items: string[];
  statusEffects: StatusEffect[];
}

export interface StatusEffect {
  id: string;
  name: string;
  icon: string;
  duration: number; // rodadas restantes, -1 = permanente
  description: string;
}

// Fichas pré-definidas 3D&T style
export const PRESET_CHARACTERS: Omit<Character, 'id'>[] = [
  {
    name: 'Aldric, o Guerreiro',
    class: 'guerreiro',
    race: 'humano',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    forca: { base: 3, current: 3, max: 3 },
    habilidade: { base: 2, current: 2, max: 2 },
    resistencia: { base: 3, current: 3, max: 3 },
    armadura: 3,
    pontosMagia: { base: 0, current: 0, max: 0 },
    pontosVida: { base: 15, current: 15, max: 15 },
    vantagens: ['Força Colossal', 'Armadura Pesada'],
    desvantagens: ['Código de Honra'],
    gold: 30,
    items: ['Espada Longa', 'Escudo de Madeira', 'Poção de Cura'],
    statusEffects: []
  },
  {
    name: 'Lyra, a Maga',
    class: 'mago',
    race: 'elfo',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    forca: { base: 1, current: 1, max: 1 },
    habilidade: { base: 3, current: 3, max: 3 },
    resistencia: { base: 2, current: 2, max: 2 },
    armadura: 1,
    pontosMagia: { base: 10, current: 10, max: 10 },
    pontosVida: { base: 10, current: 10, max: 10 },
    vantagens: ['Magia Aprimorada', 'Sentidos Élficos'],
    desvantagens: ['Fobia (Morte)'],
    gold: 20,
    items: ['Cajado Arcano', 'Grimório', 'Poção de Mana', 'Poção de Cura'],
    statusEffects: []
  },
  {
    name: 'Sombra, o Ladino',
    class: 'ladino',
    race: 'halfling',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    forca: { base: 2, current: 2, max: 2 },
    habilidade: { base: 4, current: 4, max: 4 },
    resistencia: { base: 2, current: 2, max: 2 },
    armadura: 2,
    pontosMagia: { base: 0, current: 0, max: 0 },
    pontosVida: { base: 10, current: 10, max: 10 },
    vantagens: ['Ataque Pelas Costas', 'Furtividade'],
    desvantagens: ['Inimigo (Guilda dos Ladrões)'],
    gold: 50,
    items: ['Adaga +1', 'Ferramentas de Ladrão', 'Corda e Gancho', 'Poção de Cura'],
    statusEffects: []
  },
  {
    name: 'Brenn, o Clérigo',
    class: 'clerigo',
    race: 'humano',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    forca: { base: 2, current: 2, max: 2 },
    habilidade: { base: 2, current: 2, max: 2 },
    resistencia: { base: 2, current: 2, max: 2 },
    armadura: 2,
    pontosMagia: { base: 6, current: 6, max: 6 },
    pontosVida: { base: 10, current: 10, max: 10 },
    vantagens: ['Cura Aprimorada', 'Devoto'],
    desvantagens: ['Obrigação (Igreja de Khalmyr)'],
    gold: 15,
    items: ['Maça Benta', 'Escudo Sagrado', 'Símbolo Sagrado', 'Poção de Cura x2'],
    statusEffects: []
  }
];

export const CLASS_ICONS: Record<CharacterClass, string> = {
  guerreiro: '⚔️',
  mago: '🔮',
  ladino: '🗡️',
  clerigo: '🌟',
  ranger: '🏹',
  bardo: '🎵',
  druida: '🌿',
  paladino: '🛡️',
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
};
