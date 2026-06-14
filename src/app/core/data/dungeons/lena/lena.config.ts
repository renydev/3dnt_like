import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const LenaConfig: DungeonConfig = {
  floorNumber: 4,
  theme: VALKARIA_FLOORS[3],
  layout: {
    floorNumber: 4,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal do Além',           connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'puzzle',   name: 'Enigma dos Mortos',         connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'empty',    name: 'Corredor Espectral',        connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'trap',     name: 'Toque da Morte Imediata',   connections: [6] },
      { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Câmara do Destino',         connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'rest',     name: 'Antecâmara do Silêncio',    connections: [7] },
      { id: 6, row: 3, col: 1, type: 'monster',  name: 'Espectros Eternos',         connections: [8] },
      { id: 7, row: 3, col: 3, type: 'puzzle',   name: 'Julgamento de Lena',        connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Trono da Ceifadora',        connections: [] },
    ],
  },
};
