import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const OceanoConfig: DungeonConfig = {
  floorNumber: 13,
  theme: VALKARIA_FLOORS[12],
  layout: {
    floorNumber: 13,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Câmara de Mergulho',   connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'trap',     name: 'Corrente Submarina',   connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'monster',  name: 'Câmara dos Sahuagins', connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara das Pérolas',   connections: [6] },
      { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara dos Polvos',    connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'trap',     name: 'Câmara Pressurizada',  connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara de Ar',         connections: [8] },
      { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara dos Tubarões',  connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Abismo do Kraken',     connections: [] },
    ],
  },
};
