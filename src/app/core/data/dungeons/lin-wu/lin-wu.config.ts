import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { LIN_WU_ROOM_ENEMIES, rollLinWuEncounter } from './lin-wu.monsters';

export const LinWuConfig: DungeonConfig = {
  floorNumber: 11,
  theme: VALKARIA_FLOORS[10],
  roomEnemies: LIN_WU_ROOM_ENEMIES,
  rollEncounter: rollLinWuEncounter,
  layout: {
    floorNumber: 11,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portão do Dojo',           connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara dos Monges',        connections: [4, 5] },
      { id: 2, row: 1, col: 2, type: 'rest',     name: 'Jardim de Meditação',       connections: [5] },
      { id: 3, row: 1, col: 3, type: 'monster',  name: 'Câmara dos Samurais',      connections: [5, 6] },
      { id: 4, row: 2, col: 0, type: 'treasure', name: 'Armaria Sagrada',          connections: [7] },
      { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara do Mestre Ninja',   connections: [7] },
      { id: 6, row: 2, col: 4, type: 'trap',     name: 'Teste de Agilidade',       connections: [7] },
      { id: 7, row: 3, col: 2, type: 'boss',     name: 'Câmara do Sensei Imortal', connections: [] },
    ],
  },
};
