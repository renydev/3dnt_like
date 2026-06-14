import { DungeonTheme, ImageMapConfig, RoomScenario, RoomType } from '../../../models/dungeon.model';
import { Enemy } from '../../../models/combat.model';

export type RoomLayout = {
  id: number;
  row: number;
  col: number;
  type: RoomType;
  name: string;
  connections: number[];
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
