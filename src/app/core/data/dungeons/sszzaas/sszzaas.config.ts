import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const SszzaasConfig: DungeonConfig = {
  floorNumber: 15,
  theme: VALKARIA_FLOORS[14],
  layout: {
    floorNumber: 15,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada do Ninho',               connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara das Cobras Rei',          connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'trap',     name: 'Câmara de Gás Venenoso',         connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara das Escamas de Naga',     connections: [6] },
      { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara das Víboras',             connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'trap',     name: 'Poça de Ácido',                  connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Antro Temporariamente Seguro',   connections: [8] },
      { id: 7, row: 3, col: 3, type: 'monster',  name: 'Câmara do Basilisco',            connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara da Naga Rainha',          connections: [] },
    ],
  },
};
