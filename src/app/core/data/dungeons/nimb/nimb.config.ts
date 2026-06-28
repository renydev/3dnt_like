import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { NIMB_ROOM_ENEMIES, rollNimbEncounter } from './nimb.monsters';

// Losango compacto (1-2-3-4-3-2-1, 16 salas). Veredito por fileira (debug panel):
//  fileira 1 (trivial): fera_caos
//  fileira 2 (trivial): fera_caos
//  fileira 3 (equilibrado): fera_caos
//  fileira 4 (arriscado): tarrasque
//  fileira 5 (mortal): tarrasque
//  chefe: hit
export const NimbConfig: DungeonConfig = {
  floorNumber: 18,
  theme: VALKARIA_FLOORS[17],
  layout: {
    floorNumber: 18,
    rooms: [
      { id: 0, row: 0, col: 0, type: 'entrance', name: 'Entrada Principal', connections: [1, 2] },
      { id: 1, row: 1, col: -1, type: 'monster', name: 'Trilha de Fera-do-Caos', connections: [0, 3] },
      { id: 2, row: 1, col: 1, type: 'trap', name: 'Corredor Armado', connections: [0, 4] },
      { id: 3, row: 2, col: -2, type: 'monster', name: 'Covil de Fera-do-Caos', connections: [1, 6] },
      { id: 4, row: 2, col: 0, type: 'treasure', name: 'Câmara do Ouro', connections: [2, 5] },
      { id: 5, row: 2, col: 2, type: 'trap', name: 'Sala das Armadilhas', connections: [4, 9] },
      { id: 6, row: 3, col: -3, type: 'monster', name: 'Território de Fera-do-Caos', connections: [3, 7] },
      { id: 7, row: 3, col: -1, type: 'treasure', name: 'Câmara do Tesouro', connections: [6, 10] },
      { id: 8, row: 3, col: 1, type: 'treasure', name: 'Câmara dos Segredos', connections: [9, 12] },
      { id: 9, row: 3, col: 3, type: 'puzzle', name: 'Câmara dos Mistérios', connections: [5, 8] },
      { id: 10, row: 4, col: -2, type: 'monster', name: 'Covil de O Tarrasque', connections: [7, 13] },
      { id: 11, row: 4, col: 0, type: 'merchant', name: 'O Comerciante Misterioso', connections: [12, 14] },
      { id: 12, row: 4, col: 2, type: 'social', name: 'Os Sobreviventes', connections: [8, 11] },
      { id: 13, row: 5, col: -1, type: 'monster', name: 'Ninho de O Tarrasque', connections: [10, 15] },
      { id: 14, row: 5, col: 1, type: 'rest', name: 'Fogueira Final', connections: [11, 15] },
      { id: 15, row: 6, col: 0, type: 'boss', name: 'Câmara do Guardião Final', connections: [13, 14] },
    ],
  },
  roomEnemies: NIMB_ROOM_ENEMIES,
  rollEncounter: rollNimbEncounter,
};
