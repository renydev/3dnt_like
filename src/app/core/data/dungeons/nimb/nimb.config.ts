import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { NIMB_ROOM_ENEMIES, rollNimbEncounter } from './nimb.monsters';

export const NimbConfig: DungeonConfig = {
  floorNumber: 18,
  theme: VALKARIA_FLOORS[17],
  roomEnemies: NIMB_ROOM_ENEMIES,
  rollEncounter: rollNimbEncounter,
  layout: {
    floorNumber: 18,
    rooms: [
      { id: 0, row: 0, col: 2, type: 'entrance', name: 'Entrada do Caos',            connections: [1, 2, 3] },
      { id: 1, row: 1, col: 1, type: 'monster',  name: 'Câmara do Slaad',            connections: [4, 5] },
      { id: 2, row: 1, col: 2, type: 'trap',     name: 'Inversão de Gravidade',      connections: [4, 5, 6] },
      { id: 3, row: 1, col: 3, type: 'monster',  name: 'Câmara do Beholder',         connections: [5, 6] },
      { id: 4, row: 2, col: 0, type: 'treasure', name: 'Câmara do Artefato Caótico', connections: [7] },
      { id: 5, row: 2, col: 2, type: 'monster',  name: 'Câmara do Mimético',         connections: [7] },
      { id: 6, row: 2, col: 4, type: 'trap',     name: 'Teleporte Aleatório',        connections: [7] },
      { id: 7, row: 3, col: 2, type: 'boss',     name: 'Vórtice do Sem-Nome de Nimb',connections: [] },
    ],
  },
};
