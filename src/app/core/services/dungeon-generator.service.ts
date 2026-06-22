import { Injectable } from '@angular/core';
import { DungeonFloor, DungeonRoom, DungeonTheme, RoomScenario, RoomType, VALKARIA_FLOORS } from '../models/dungeon.model';
import { DUNGEON_REGISTRY } from '../data/dungeons/dungeon-registry';
import { FloorLayout } from '../data/dungeons/shared/dungeon-config.types';

@Injectable({ providedIn: 'root' })
export class DungeonGeneratorService {

  generateFloor(floorNumber: number): DungeonFloor {
    const config = DUNGEON_REGISTRY[floorNumber];

    if (config) {
      const rooms = this.buildFromLayout(config.layout, config.theme, !!config.imageMap, config.roomScenarios);
      return {
        floorNumber,
        theme: config.theme,
        rooms,
        totalRooms: rooms.length,
        bossRoom: rooms.find(r => r.type === 'boss')!.id,
      };
    }

    // Andares sem config definida: geração procedural
    const idx = Math.min(floorNumber - 1, VALKARIA_FLOORS.length - 1);
    const theme = VALKARIA_FLOORS[idx];
    const rooms = this.generateRooms(floorNumber, theme);
    return {
      floorNumber,
      theme,
      rooms,
      totalRooms: rooms.length,
      bossRoom: rooms.find(r => r.type === 'boss')!.id,
    };
  }

  private buildFromLayout(layout: FloorLayout, theme: DungeonTheme, allVisible = false, scenarios?: Record<number, RoomScenario>): DungeonRoom[] {
    const rooms: DungeonRoom[] = layout.rooms.map(r => ({
      id: r.id,
      type: r.type,
      name: r.name,
      description: this.generateRoomDescription(r.type, theme),
      cleared: r.type === 'entrance',
      locked: false,
      connections: [...r.connections],
      secretConnections: r.secretConnections ? [...r.secretConnections] : undefined,
      col: r.col,
      row: r.row,
      isVisible: allVisible || r.type === 'entrance',
      isCurrent: r.type === 'entrance',
      entered: r.type === 'entrance',
      scenario: scenarios?.[r.id],
    }));

    if (!allVisible) {
      const entrance = rooms.find(r => r.type === 'entrance')!;
      rooms.forEach(r => {
        if (entrance.connections.includes(r.id)) r.isVisible = true;
      });
    }

    return rooms;
  }

  private generateRooms(floor: number, theme: DungeonTheme): DungeonRoom[] {
    const COLS = 5;
    const ROWS = 4;
    const rooms: DungeonRoom[] = [];
    let id = 0;

    for (let row = 0; row < ROWS; row++) {
      const isEntrance = row === 0;
      const isBoss = row === ROWS - 1;
      const colsThisRow = (isEntrance || isBoss) ? 1 : COLS;
      const startCol = (isEntrance || isBoss) ? Math.floor(COLS / 2) : 0;

      for (let col = startCol; col < startCol + colsThisRow; col++) {
        const type = this.pickRoomType(row, ROWS, theme);
        const room: DungeonRoom = {
          id: id++,
          type,
          name: this.generateRoomName(type, theme),
          description: this.generateRoomDescription(type, theme),
          cleared: isEntrance,
          locked: false,
          connections: [],
          col,
          row,
          isVisible: isEntrance,
          isCurrent: isEntrance && col === Math.floor(COLS / 2),
        };
        rooms.push(room);
      }
    }

    this.buildConnections(rooms, COLS, ROWS);

    const entrance = rooms.find(r => r.type === 'entrance')!;
    rooms.forEach(r => {
      if (entrance.connections.includes(r.id)) r.isVisible = true;
    });

    return rooms;
  }

  private pickRoomType(row: number, totalRows: number, theme: DungeonTheme): RoomType {
    if (row === 0) return 'entrance';
    if (row === totalRows - 1) return 'boss';

    const weights = this.getWeightsForChallenge(theme.challengeType);
    const roll = Math.random() * 100;
    let acc = 0;
    for (const [type, weight] of weights) {
      acc += weight;
      if (roll < acc) return type as RoomType;
    }
    return 'monster';
  }

  private getWeightsForChallenge(type: string): [string, number][] {
    switch (type) {
      case 'combat':   return [['monster', 55], ['treasure', 20], ['rest', 15], ['empty', 10]];
      case 'stealth':  return [['trap', 50], ['monster', 20], ['treasure', 15], ['rest', 10], ['empty', 5]];
      case 'puzzle':   return [['puzzle', 40], ['monster', 20], ['trap', 15], ['treasure', 15], ['rest', 10]];
      case 'social':   return [['social', 40], ['monster', 15], ['treasure', 25], ['rest', 15], ['empty', 5]];
      case 'survival': return [['monster', 40], ['trap', 30], ['rest', 15], ['treasure', 10], ['empty', 5]];
      case 'darkness': return [['monster', 45], ['trap', 25], ['treasure', 15], ['rest', 10], ['empty', 5]];
      default:         return [['monster', 35], ['trap', 20], ['puzzle', 15], ['treasure', 15], ['rest', 10], ['empty', 5]];
    }
  }

  private buildConnections(rooms: DungeonRoom[], cols: number, totalRows: number): void {
    const byRow: DungeonRoom[][] = [];
    rooms.forEach(r => {
      if (!byRow[r.row]) byRow[r.row] = [];
      byRow[r.row].push(r);
    });

    for (let row = 0; row < byRow.length - 1; row++) {
      const current = byRow[row];
      const next = byRow[row + 1];

      if (current.length === 1) {
        const src = current[0];
        next.forEach(dest => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
        continue;
      }

      if (next.length === 1) {
        const dest = next[0];
        current.forEach(src => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
        continue;
      }

      current.forEach(src => {
        const candidates = next.filter(r => Math.abs(r.col - src.col) <= 1);
        const chosen = new Set<DungeonRoom>();
        const same = next.find(r => r.col === src.col);
        if (same) chosen.add(same);
        if (candidates.length && chosen.size < 2) {
          chosen.add(candidates[Math.floor(Math.random() * candidates.length)]);
        }
        chosen.forEach(dest => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
      });

      next.forEach(dest => {
        if (!dest.connections.length) {
          const closest = current.reduce((a, b) =>
            Math.abs(a.col - dest.col) <= Math.abs(b.col - dest.col) ? a : b
          );
          closest.connections.push(dest.id);
          dest.connections.push(closest.id);
        }
      });
    }
  }

  private generateRoomName(type: RoomType, theme: DungeonTheme): string {
    const names: Record<string, string[]> = {
      entrance: ['Portal de Entrada', 'Câmara de Chegada', 'Ponto de Partida'],
      monster:  [`Covil de ${theme.monsterTypes[0]}`, `Câmara de ${theme.monsterTypes[1] ?? 'Monstros'}`, 'Salão dos Inimigos'],
      trap:     ['Corredor Armadilhado', `Zona de ${theme.trapTypes[0]}`, 'Passagem Mortal'],
      treasure: ['Câmara do Tesouro', 'Sala dos Artefatos', 'Cofre Oculto'],
      rest:     ['Braseiro Solitário', 'Ponto de Repouso', 'Câmara de Alívio'],
      boss:     [`Câmara de ${theme.guardianName}`, 'Salão do Guardião', 'Câmara do Desafio Final'],
      empty:    ['Corredor Vazio', 'Passagem Silenciosa', 'Galeria Escura'],
      puzzle:   ['Câmara dos Enigmas', 'Sala do Teste', 'Câmara do Saber'],
      social:   ['Câmara do Encontro', 'Salão das Vozes', 'Câmara da Diplomacia'],
    };
    const list = names[type] ?? ['Câmara Desconhecida'];
    return list[Math.floor(Math.random() * list.length)];
  }

  private generateRoomDescription(type: RoomType, theme: DungeonTheme): string {
    const flavor = theme.flavorTexts[Math.floor(Math.random() * theme.flavorTexts.length)];
    const typeDesc: Record<string, string> = {
      entrance: 'O ponto de partida neste andar sagrado.',
      monster:  `Encontros com ${theme.monsterTypes[Math.floor(Math.random() * theme.monsterTypes.length)]}. Prepare-se.`,
      trap:     theme.trapTypes[Math.floor(Math.random() * theme.trapTypes.length)] + '. Cuidado ao avançar.',
      treasure: theme.treasureTypes[Math.floor(Math.random() * theme.treasureTypes.length)] + ' pode estar aqui.',
      rest:     'Um raro momento de trégua neste inferno.',
      boss:     theme.guardianDesc,
      empty:    'Nada aqui além de silêncio e sombra.',
      puzzle:   'Um teste da mente. Pense antes de agir.',
      social:   'Uma criatura que pode conversar... ou não.',
    };
    return `${typeDesc[type] ?? ''} ${flavor}`;
  }

  revealConnected(rooms: DungeonRoom[], currentId: number, canDetectSecrets = false): DungeonRoom[] {
    const current = rooms.find(r => r.id === currentId)!;
    return rooms.map(r => {
      const visibleViaSecret = canDetectSecrets && (current.secretConnections?.includes(r.id) ?? false);
      return {
        ...r,
        isVisible: r.isVisible || current.connections.includes(r.id) || visibleViaSecret,
        isSecretRevealed: r.isSecretRevealed || visibleViaSecret,
      };
    });
  }

  moveToRoom(rooms: DungeonRoom[], targetId: number): DungeonRoom[] {
    return rooms.map(r => ({
      ...r,
      isCurrent: r.id === targetId,
      entered: r.entered || r.id === targetId,
    }));
  }
}
