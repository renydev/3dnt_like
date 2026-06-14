import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const MegalokConfig: DungeonConfig = {
  floorNumber: 17,
  theme: VALKARIA_FLOORS[16],
  layout: {
    floorNumber: 17,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada da Toca Colossal',         connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara do Dragão Ancião',          connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'trap',     name: 'Queda de Teto Colossal',           connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara do Tesouro do Monstro',     connections: [6] },
      { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara da Hidra de Doze Cabeças',  connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'monster',  name: 'Câmara do Gigante',                connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Gruta Temporariamente Vazia',      connections: [8] },
      { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara da Rocha Viva',             connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Tiranossauro Colossal',  connections: [] },
    ],
  },
};
