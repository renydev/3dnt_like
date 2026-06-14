import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';

export const GloriennConfig: DungeonConfig = {
  floorNumber: 3,
  theme: VALKARIA_FLOORS[2],
  layout: {
    floorNumber: 3,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Arco de Mármore Élfico',    connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'empty',    name: 'Corredor de Runas',          connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'monster',  name: 'Arqueiros de Emboscada',     connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'treasure', name: 'Câmara do Grimório Arcano',  connections: [6] },
      { id: 4, row: 2, col: 2, type: 'puzzle',   name: 'Runa Élfica Bloqueante',     connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'trap',     name: 'Rede de Vento Automática',   connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Fonte Sagrada de Glórienn',  connections: [8] },
      { id: 7, row: 3, col: 3, type: 'monster',  name: 'Mago Élfico de Elite',       connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Torre do Arqueiro Arcano',   connections: [] },
    ],
  },
};
