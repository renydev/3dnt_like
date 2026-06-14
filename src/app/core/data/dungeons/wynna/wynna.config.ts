import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const WynnaConfig: DungeonConfig = {
  floorNumber: 12,
  theme: VALKARIA_FLOORS[11],
  layout: {
    floorNumber: 12,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Portal Feérico',               connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'social',   name: 'Câmara dos Gênios',             connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'trap',     name: 'Ilusão de Caminho',             connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara das Frutas Douradas',    connections: [6] },
      { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara das Fadas Guerreiras',   connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'monster',  name: 'Câmara do Unicórnio',           connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Claro Encantado',               connections: [8] },
      { id: 7, row: 3, col: 3, type: 'trap',     name: 'Dimensão Hostil',               connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Trono da Rainha das Fadas',     connections: [] },
    ],
  },
};
