import { Injectable } from '@angular/core';
import {
  DungeonFloor, DungeonRoom, DungeonTheme, RoomType,
  VALKARIA_THEMES
} from '../models/dungeon.model';

@Injectable({ providedIn: 'root' })
export class DungeonGeneratorService {

  // Gera um andar completo da masmorra
  generateFloor(floorNumber: number, themeId?: string): DungeonFloor {
    const theme = themeId
      ? VALKARIA_THEMES.find(t => t.id === themeId) ?? this.randomTheme()
      : this.randomTheme();

    const rooms = this.generateRooms(floorNumber, theme);

    return {
      floorNumber,
      theme,
      rooms,
      totalRooms: rooms.length,
      bossRoom: rooms.find(r => r.type === 'boss')!.id
    };
  }

  private randomTheme(): DungeonTheme {
    return VALKARIA_THEMES[Math.floor(Math.random() * VALKARIA_THEMES.length)];
  }

  // Gera uma grade de salas: 5 colunas x N linhas, conectadas top-down
  private generateRooms(floor: number, theme: DungeonTheme): DungeonRoom[] {
    const COLS = 5;
    const ROWS = 3 + Math.floor(floor / 2); // mais andares = mais linhas
    const rooms: DungeonRoom[] = [];
    let id = 0;

    // Distribuição de tipos por linha
    for (let row = 0; row < ROWS; row++) {
      const colsThisRow = row === 0 ? 1 : row === ROWS - 1 ? 1 : COLS;
      const startCol = row === 0 || row === ROWS - 1
        ? Math.floor(COLS / 2)
        : 0;

      for (let col = startCol; col < startCol + colsThisRow; col++) {
        const type = this.pickRoomType(row, ROWS, col);
        const room: DungeonRoom = {
          id: id++,
          type,
          name: this.generateRoomName(type, theme),
          description: this.generateRoomDescription(type, theme),
          cleared: row === 0, // entrada já começa limpa
          locked: false,
          connections: [],
          col,
          row,
          isVisible: row === 0,
          isCurrent: row === 0 && col === Math.floor(COLS / 2)
        };
        rooms.push(room);
      }
    }

    // Conectar salas: cada sala se conecta a 1-3 salas da próxima linha
    this.buildConnections(rooms, COLS, ROWS);

    return rooms;
  }

  private pickRoomType(row: number, totalRows: number, col: number): RoomType {
    if (row === 0) return 'entrance';
    if (row === totalRows - 1) return 'boss';

    const weights: [RoomType, number][] = [
      ['monster', 40],
      ['trap', 20],
      ['treasure', 15],
      ['rest', 15],
      ['empty', 10],
    ];

    const roll = Math.random() * 100;
    let acc = 0;
    for (const [type, weight] of weights) {
      acc += weight;
      if (roll < acc) return type;
    }
    return 'monster';
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

      // Entrada e boss: conectar com todos da próxima/anterior
      if (current.length === 1) {
        const src = current[0];
        next.forEach(dest => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
        return;
      }

      if (next.length === 1) {
        const dest = next[0];
        current.forEach(src => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
        return;
      }

      // Linha normal: cada sala conecta a 1-2 salas abaixo (posição próxima + aleatório)
      current.forEach(src => {
        const sameColDest = next.find(r => r.col === src.col);
        const candidates = next.filter(r => Math.abs(r.col - src.col) <= 1);

        const chosen = new Set<DungeonRoom>();
        if (sameColDest) chosen.add(sameColDest);
        if (candidates.length > 0 && chosen.size < 2) {
          const extra = candidates[Math.floor(Math.random() * candidates.length)];
          chosen.add(extra);
        }

        chosen.forEach(dest => {
          if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
          if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        });
      });

      // Garantir que toda sala do próximo nível tenha ao menos uma conexão
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
    const names: Record<RoomType, string[]> = {
      entrance: ['Entrada Principal', 'Portal de Acesso', 'Portão Sombrio'],
      monster: [`Covil de ${theme.monsterTypes[0]}`, `Câmara de ${theme.monsterTypes[1]}`, 'Sala dos Horrores', 'Câmara Sombria'],
      trap: [`Corredor das ${theme.trapTypes[0]}`, 'Sala Armadilhada', 'Corredor da Morte'],
      treasure: ['Câmara do Tesouro', 'Sala dos Artefatos', 'Câmara Esquecida'],
      rest: ['Braseiro Antigo', 'Acampamento Abandonado', 'Santuário Menor'],
      boss: ['Salão do Senhor das Trevas', 'Câmara do Guardião', 'Trono do Mal'],
      empty: ['Corredor Escuro', 'Passagem Estreita', 'Galeria Silenciosa']
    };
    const list = names[type];
    return list[Math.floor(Math.random() * list.length)];
  }

  private generateRoomDescription(type: RoomType, theme: DungeonTheme): string {
    const flavor = theme.flavorTexts[Math.floor(Math.random() * theme.flavorTexts.length)];
    const typeDesc: Record<RoomType, string> = {
      entrance: 'O ponto de partida. O cheiro de aventura — e perigo — paira no ar.',
      monster: `Um ${theme.monsterTypes[Math.floor(Math.random() * theme.monsterTypes.length)]} aguarda aqui.`,
      trap: `${theme.trapTypes[Math.floor(Math.random() * theme.trapTypes.length)]} detectada. Cuidado!`,
      treasure: `Um ${theme.treasureTypes[Math.floor(Math.random() * theme.treasureTypes.length)]} pode estar aqui.`,
      rest: 'Um momento de alívio nesta escuridão. Você pode descansar aqui.',
      boss: 'Uma presença sombria domina este lugar. O guardião do andar espera.',
      empty: 'Nada aqui além de sombra e silêncio.'
    };
    return `${typeDesc[type]} ${flavor}`;
  }

  // Revela salas conectadas à sala atual
  revealConnected(rooms: DungeonRoom[], currentId: number): DungeonRoom[] {
    const current = rooms.find(r => r.id === currentId)!;
    return rooms.map(r => ({
      ...r,
      isVisible: r.isVisible || current.connections.includes(r.id)
    }));
  }

  // Move o jogador para uma sala
  moveToRoom(rooms: DungeonRoom[], targetId: number): DungeonRoom[] {
    return rooms.map(r => ({
      ...r,
      isCurrent: r.id === targetId
    }));
  }
}
