import { VALKARIA_FLOORS } from '../data/campaigns/valkaria/valkaria-floors';
export { VALKARIA_FLOORS } from '../data/campaigns/valkaria/valkaria-floors';

export type RoomType =
  | 'entrance' | 'monster' | 'trap' | 'treasure' | 'rest' | 'boss' | 'empty' | 'puzzle' | 'social' | 'merchant'
  // Sala de resgate: derrotar os captores liberta um refém, que se junta à party como companheiro.
  | 'hostage';

export type RoomChoiceAction = 'enter' | 'flee' | 'safe_enter' | 'rest_wait';

export type StoryEffect =
  | { type: 'set_flag'; flag: string; value: string | number | boolean }
  | { type: 'increment_flag'; flag: string; amount?: number }
  | { type: 'add_log'; text: string }
  | { type: 'grant_gold'; amount: number }
  | { type: 'grant_xp'; amount: number }
  | { type: 'clear_room' };

export interface RoomChoice {
  label: string;
  description?: string;
  action: RoomChoiceAction;
  requiresPericia?: string; // ID da perícia exigida (oculta se party não tiver)
  effects?: StoryEffect[];
}

export interface RoomScenario {
  description: string;
  choices: RoomChoice[];
}

/** Tipo de exigência de acesso a uma sala — perícia específica, atributo mínimo ou item no inventário. */
export type RoomRequirementType = 'pericia' | 'atributo' | 'item';

export interface RoomRequirement {
  type: RoomRequirementType;
  /** ID da perícia exigida (quando type === 'pericia'). */
  pericia?: string;
  /** Atributo exigido (quando type === 'atributo'). */
  atributo?: 'poder' | 'habilidade' | 'resistencia';
  /** Valor mínimo do atributo (quando type === 'atributo'). */
  minValue?: number;
  /** ID do item exigido no inventário ou equipamento (quando type === 'item'). */
  itemId?: string;
  /** Nome legível da exigência, exibido ao jogador (ex.: "Perícia Investigação", "Resistência 4+", "Chave Élfica"). */
  label: string;
}

export interface DungeonRoom {
  id: number;
  type: RoomType;
  name: string;
  description: string;
  cleared: boolean;
  locked: boolean;
  connections: number[];
  secretConnections?: number[]; // requer detecção (perícia Investigação/Crime ou vantagem sensorial)
  col: number;
  row: number;
  isCurrent?: boolean;
  isVisible?: boolean;
  isSecretRevealed?: boolean; // porta secreta detectada mas ainda não totalmente explorada
  entered?: boolean;
  rested?: boolean;
  scenario?: RoomScenario;
  /** Se definido, a sala só pode ser acessada por uma party que satisfaça esta exigência (ver meetsRoomRequirement em game-state.service). */
  requirement?: RoomRequirement;
}

export interface MapHotspot {
  roomId: number;
  label: string;
  cx: number;
  cy: number;
  r?: number;
  w?: number;
  h?: number;
}

export interface ImageMapConfig {
  url: string;
  viewBox: string;
  hotspots: MapHotspot[];
}

export interface DungeonFloor {
  floorNumber: number;
  theme: DungeonTheme;
  rooms: DungeonRoom[];
  totalRooms: number;
  bossRoom: number;
  imageMap?: ImageMapConfig;
}

export interface DungeonTheme {
  id: string;
  floorNumber: number;           // 1-20
  godName: string;               // Nome do deus
  godDomain: string;             // Domínio/título
  godAlignment: 'bem' | 'neutro' | 'mal' | 'caos';
  name: string;                  // Nome da masmorra
  description: string;           // Descrição temática
  guardianName: string;          // Nome do guardião final
  guardianDesc: string;          // Descrição do guardião
  specialRule: string;           // Regra especial da masmorra
  icon: string;
  palette: string;
  monsterTypes: string[];
  trapTypes: string[];
  treasureTypes: string[];
  challengeType: 'combat' | 'stealth' | 'social' | 'puzzle' | 'survival' | 'darkness' | 'mixed';
  flavorTexts: string[];
}

export const ROOM_ICONS: Record<RoomType, string> = {
  entrance: '🚪',
  monster: '👹',
  trap: '⚠️',
  treasure: '💰',
  rest: '🏕️',
  boss: '💀',
  empty: '▫️',
  puzzle: '🔍',
  social: '💬',
  merchant: '🛒',
  hostage: '🎗️',
};

export const ROOM_LABELS: Record<RoomType, string> = {
  entrance: 'Entrada',
  monster: 'Monstro',
  trap: 'Armadilha',
  treasure: 'Tesouro',
  rest: 'Descanso Profundo',
  boss: 'Guardião',
  empty: 'Corredor',
  puzzle: 'Enigma',
  social: 'Encontro Social',
  merchant: 'Mercador',
  hostage: 'Resgate de Refém',
};

// Alias para compatibilidade
export const VALKARIA_THEMES = VALKARIA_FLOORS;

