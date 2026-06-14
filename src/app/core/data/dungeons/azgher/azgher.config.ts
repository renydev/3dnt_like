import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const AzgherConfig: DungeonConfig = {
  floorNumber: 8,
  theme: VALKARIA_FLOORS[7],
  layout: {
    floorNumber: 8,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal do Sol Ardente',        connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'trap',     name: 'Câmara de Calor Extremo',      connections: [4, 5] },
      { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara da Múmia',              connections: [4, 5] },
      { id: 3, row: 1, col: 3, type: 'puzzle',   name: 'Enigma da Esfinge Menor',      connections: [5, 6] },
      { id: 4, row: 2, col: 1, type: 'trap',     name: 'Areia Movediça',               connections: [7] },
      { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara dos Escorpiões',        connections: [7] },
      { id: 6, row: 2, col: 4, type: 'treasure', name: 'Câmara dos Artefatos Solares', connections: [7] },
      { id: 7, row: 3, col: 2, type: 'boss',     name: 'Câmara da Grande Esfinge',     connections: [] },
    ],
  },
};
