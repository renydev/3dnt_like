import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const TenebraConfig: DungeonConfig = {
  floorNumber: 7,
  theme: VALKARIA_FLOORS[6],
  layout: {
    floorNumber: 7,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Boca das Trevas',           connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara dos Zumbis',         connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'trap',     name: 'Fossa Oculta',              connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'monster',  name: 'Covil do Licantropo',       connections: [6] },
      { id: 4, row: 2, col: 2, type: 'monster',  name: 'Câmara do Wight',           connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'treasure', name: 'Cripta Esquecida',           connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Câmara da Chama Sombria',   connections: [8] },
      { id: 7, row: 3, col: 3, type: 'monster',  name: 'Antro do Vampiro Menor',    connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Vampiro Ancião',  connections: [] },
    ],
  },
};
