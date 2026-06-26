import { DungeonTheme, ImageMapConfig, RoomRequirement, RoomScenario, RoomType } from '../../../models/dungeon.model';
import { Enemy } from '../../../models/combat.model';
import { GrowthScale } from '../../../utils/pp-calculator';

export type RoomLayout = {
  id: number;
  row: number;
  col: number;
  /** Um único tipo fixo, ou uma lista — neste caso um é sorteado na geração do andar, para variedade entre partidas. */
  type: RoomType | RoomType[];
  name: string;
  connections: number[];
  secretConnections?: number[]; // conexões via porta secreta
  /** Se definido, a sala só pode ser acessada por uma party que satisfaça esta exigência (perícia/atributo/item). */
  requirement?: RoomRequirement;
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
  /** `scale` = fator de crescimento do andar (ver pp-calculator.ts: computeGrowthScale), derivado do PP e da distribuição de atributos reais da party. */
  roomEnemies?: Record<number, (scale: GrowthScale) => Enemy[]>;
  rollEncounter?: (scale: GrowthScale) => Enemy[];
  roomScenarios?: Record<number, RoomScenario>;
}
