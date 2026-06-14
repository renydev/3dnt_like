import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const KhalmyrConfig: DungeonConfig = {
  floorNumber: 19,
  theme: VALKARIA_FLOORS[18],
  layout: {
    floorNumber: 19,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal da Justiça',            connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'puzzle',   name: 'Câmara da Verdade',            connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'monster',  name: 'Câmara do Anjo da Justiça',    connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara da Espada da Justiça',  connections: [6] },
      { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Câmara do Julgamento',         connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'monster',  name: 'Câmara do Golem de Mármore',   connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara da Absolvição',         connections: [8] },
      { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara do Juiz Espectral',     connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Paladino Supremo',   connections: [] },
    ],
  },
};
