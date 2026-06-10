export type RoomType = 'entrance' | 'monster' | 'trap' | 'treasure' | 'rest' | 'boss' | 'empty';

export interface DungeonRoom {
  id: number;
  type: RoomType;
  name: string;
  description: string;
  cleared: boolean;
  locked: boolean;
  connections: number[]; // IDs das salas conectadas
  col: number;
  row: number;
  isCurrent?: boolean;
  isVisible?: boolean;
}

export interface DungeonFloor {
  floorNumber: number;
  theme: DungeonTheme;
  rooms: DungeonRoom[];
  totalRooms: number;
  bossRoom: number;
}

export interface DungeonTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  palette: string;
  monsterTypes: string[];
  trapTypes: string[];
  treasureTypes: string[];
  flavorTexts: string[];
}

export const VALKARIA_THEMES: DungeonTheme[] = [
  {
    id: 'sewers',
    name: 'Esgotos de Valkaria',
    description: 'As entranhas fedorentas da grande cidade escondem perigos inimagináveis.',
    icon: '🕳️',
    palette: 'sewers',
    monsterTypes: ['Rato Gigante', 'Goblin Esgoteiro', 'Lodo Deslizante', 'Crocodilo Mutante'],
    trapTypes: ['Vala de Lodo', 'Gás Tóxico', 'Armadilha de Grelha', 'Corrente Subterrânea'],
    treasureTypes: ['Moedas Enferrujadas', 'Amuleto Perdido', 'Mapa do Esgoto', 'Gema no Lodo'],
    flavorTexts: [
      'O cheiro é insuportável, mas as riquezas aqui enterradas valem o sacrifício.',
      'Sons de arranhão ecoam pelos túneis escuros.',
      'A água verde-escura mal reflete a luz da tocha.',
    ]
  },
  {
    id: 'catacombs',
    name: 'Catacumbas Antigas',
    description: 'Sob os templos de Valkaria jazem os mortos que recusam o descanso eterno.',
    icon: '💀',
    palette: 'catacombs',
    monsterTypes: ['Esqueleto Guerreiro', 'Zumbi Sacerdote', 'Fantasma Vingativo', 'Lich Menor'],
    trapTypes: ['Lâminas Giratórias', 'Flechas Envenenadas', 'Cova com Estacas', 'Runa Maldita'],
    treasureTypes: ['Osso Encantado', 'Relíquia Sagrada', 'Ouro Funerário', 'Grimório Esquecido'],
    flavorTexts: [
      'Sussurros de almas perdidas guiam — ou enganam — seus passos.',
      'As paredes são cobertas de inscrições em idiomas mortos.',
      'Tochas apagadas espontaneamente reacendem em chamas azuis.',
    ]
  },
  {
    id: 'fortress',
    name: 'Fortaleza Abandonada',
    description: 'Os bastidores militares de Valkaria, tomados por cultistas e mercenários.',
    icon: '🏰',
    palette: 'fortress',
    monsterTypes: ['Guarda Cultista', 'Mercenário Renegado', 'Golem de Pedra', 'Capitão Morto-Vivo'],
    trapTypes: ['Óleo Inflamável', 'Balista Automática', 'Portão com Guilhotina', 'Sala Inundante'],
    treasureTypes: ['Armadura de Guarda', 'Cofre do Tesouro', 'Mapa Estratégico', 'Espada de Oficial'],
    flavorTexts: [
      'Estandartes rasgados de facções esquecidas decoram as paredes.',
      'O cheiro de pólvora e sangue velho paira no ar.',
      'Armaduras vazias guardam seus postos como sentinelas silenciosas.',
    ]
  },
  {
    id: 'arcane_labs',
    name: 'Laboratórios Arcanos',
    description: 'Magos loucos deixaram para trás experimentos que tomaram vida própria.',
    icon: '🔮',
    palette: 'arcane',
    monsterTypes: ['Construto de Cristal', 'Elemental Corrompido', 'Homúnculo Raivoso', 'Mago Fantasma'],
    trapTypes: ['Runa Explosiva', 'Campo de Força', 'Transmutação Aleatória', 'Vórtice de Magia'],
    treasureTypes: ['Pergaminho Raro', 'Poção Experimental', 'Cristal de Mana', 'Artefato Arcano'],
    flavorTexts: [
      'Frascos coloridos borbulham com vida própria nas prateleiras.',
      'A própria realidade parece distorcida neste lugar.',
      'Equações mágicas flutuam no ar, incompletas e perigosas.',
    ]
  }
];

export const ROOM_ICONS: Record<RoomType, string> = {
  entrance: '🚪',
  monster: '👹',
  trap: '⚠️',
  treasure: '💰',
  rest: '🔥',
  boss: '💀',
  empty: '▫️'
};

export const ROOM_LABELS: Record<RoomType, string> = {
  entrance: 'Entrada',
  monster: 'Monstro',
  trap: 'Armadilha',
  treasure: 'Tesouro',
  rest: 'Descanso',
  boss: 'Chefão',
  empty: 'Corredor'
};
