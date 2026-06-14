import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const ValariaFinalConfig: DungeonConfig = {
  floorNumber: 20,
  theme: VALKARIA_FLOORS[19],
  layout: {
    floorNumber: 20,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal Final de Valkaria',     connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara das Réplicas I',        connections: [4, 5] },
      { id: 2, row: 1, col: 2, type: 'monster',  name: 'Câmara das Réplicas II',       connections: [4, 5, 6] },
      { id: 3, row: 1, col: 3, type: 'trap',     name: 'Reflexo da Maior Fraqueza',    connections: [5, 6] },
      { id: 4, row: 2, col: 0, type: 'monster',  name: 'Câmara das Réplicas III',      connections: [7] },
      { id: 5, row: 2, col: 2, type: 'rest',     name: 'Câmara de Memórias',           connections: [7] },
      { id: 6, row: 2, col: 4, type: 'treasure', name: 'Câmara da Lágrima de Valkaria',connections: [7] },
      { id: 7, row: 3, col: 2, type: 'boss',     name: 'Câmara do Avatar de Valkaria', connections: [] },
    ],
  },
};
