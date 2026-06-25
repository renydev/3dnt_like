import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { HYNINN_ROOM_ENEMIES, rollHyninnEncounter } from './hyninn.monsters';

export const HyninnConfig: DungeonConfig = {
  floorNumber: 5,
  theme: VALKARIA_FLOORS[4],
  roomEnemies: HYNINN_ROOM_ENEMIES,
  rollEncounter: rollHyninnEncounter,
  layout: {
    floorNumber: 5,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Corredor de Entrada Seguro',  connections: [1, 2] },
      { id: 1, row: 1, col: 1, type: 'trap',     name: 'Câmara das Lâminas',          connections: [3, 4] },
      { id: 2, row: 1, col: 3, type: 'trap',     name: 'Chão Falso',                   connections: [4, 5] },
      { id: 3, row: 2, col: 0, type: 'trap',     name: 'Dardos Envenenados',           connections: [6] },
      { id: 4, row: 2, col: 2, type: 'monster',  name: 'Assassino Sombrio',            connections: [6, 7] },
      { id: 5, row: 2, col: 4, type: 'treasure', name: 'Cofre Armadilhado',            connections: [7] },
      { id: 6, row: 3, col: 1, type: 'rest',     name: 'Santuário Oculto',             connections: [8] },
      { id: 7, row: 3, col: 3, type: 'trap',     name: 'Câmara de Gás',                connections: [8] },
      { id: 8, row: 3, col: 2, type: 'boss',     name: 'Câmara do Mestre das Ilusões', connections: [] },
    ],
  },
};
