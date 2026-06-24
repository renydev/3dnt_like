import { DungeonTheme, ImageMapConfig, RoomScenario, RoomType } from '../../../models/dungeon.model';
import { Enemy } from '../../../models/combat.model';

export type RoomLayout = {
  id: number;
  row: number;
  col: number;
  /** Um único tipo fixo, ou uma lista — neste caso um é sorteado na geração do andar, para variedade entre partidas. */
  type: RoomType | RoomType[];
  name: string;
  connections: number[];
  secretConnections?: number[]; // conexões via porta secreta
};

export interface FloorLayout {
  floorNumber: number;
  rooms: RoomLayout[];
}

export interface DungeonConfig {
  floorNumber: number;
  theme: DungeonTheme;
  layout: FloorLayout;
  imageMap?: ImageMapConfig;
  roomEnemies?: Record<number, () => Enemy[]>;
  rollEncounter?: () => Enemy[];
  roomScenarios?: Record<number, RoomScenario>;
}
