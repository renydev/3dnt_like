import { VALKARIA_FLOORS } from '../../../models/dungeon.model';
import { DungeonConfig } from '../shared/dungeon-config.types';
import { HYNINN_ROOM_ENEMIES, rollHyninnEncounter } from './hyninn.monsters';

// Losango compacto (1-2-3-4-3-2-1, 16 salas). Veredito por fileira (debug panel):
//  fileira 1 (trivial): bau_animado
//  fileira 2 (trivial): tigre_hyninn
//  fileira 3 (equilibrado): mimico
//  fileira 4 (arriscado): gargula
//  fileira 5 (mortal): golem_pedra
//  chefe: tigre_primordial
export const HyninnConfig: DungeonConfig = {
  floorNumber: 5,
  theme: VALKARIA_FLOORS[4],
  layout: {
    floorNumber: 5,
    rooms: [
      { id: 0, row: 0, col: 0, type: 'entrance', name: 'Entrada Principal', connections: [1, 2] },
      { id: 1, row: 1, col: -1, type: 'monster', name: 'Trilha de Baú Animado', connections: [0, 3] },
      { id: 2, row: 1, col: 1, type: 'trap', name: 'Corredor Armado', connections: [0, 4] },
      { id: 3, row: 2, col: -2, type: 'monster', name: 'Covil de Tigre-de-Hyninn', connections: [1, 6] },
      { id: 4, row: 2, col: 0, type: 'treasure', name: 'Câmara do Ouro', connections: [2, 5] },
      { id: 5, row: 2, col: 2, type: 'trap', name: 'Sala das Armadilhas', connections: [4, 9] },
      { id: 6, row: 3, col: -3, type: 'monster', name: 'Território de Mímico', connections: [3, 7] },
      { id: 7, row: 3, col: -1, type: 'treasure', name: 'Câmara do Tesouro', connections: [6, 10] },
      { id: 8, row: 3, col: 1, type: 'treasure', name: 'Câmara dos Segredos', connections: [9, 12] },
      { id: 9, row: 3, col: 3, type: 'puzzle', name: 'Câmara dos Mistérios', connections: [5, 8] },
      { id: 10, row: 4, col: -2, type: 'monster', name: 'Covil de Gárgula', connections: [7, 13] },
      { id: 11, row: 4, col: 0, type: 'merchant', name: 'O Comerciante Misterioso', connections: [12, 14] },
      { id: 12, row: 4, col: 2, type: 'social', name: 'Os Sobreviventes', connections: [8, 11] },
      { id: 13, row: 5, col: -1, type: 'monster', name: 'Ninho de Golem de Pedra', connections: [10, 15] },
      { id: 14, row: 5, col: 1, type: 'rest', name: 'Fogueira Final', connections: [11, 15] },
      { id: 15, row: 6, col: 0, type: 'boss', name: 'Câmara do Guardião Final', connections: [13, 14] },
    ],
  },
  roomEnemies: HYNINN_ROOM_ENEMIES,
  rollEncounter: rollHyninnEncounter,
};
