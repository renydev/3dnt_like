import { Injectable } from '@angular/core';
import { DungeonFloor, DungeonRoom, DungeonTheme, RoomScenario, RoomType } from '../models/dungeon.model';
import { FloorLayout } from '../data/dungeons/shared/dungeon-config.types';
import { CampaignService } from './campaign.service';

/** Chance de uma sala de tesouro sortear um mercador errante em vez de um baú. */
const MERCHANT_CHANCE = 0.25;
const MAX_PREVIOUS_CONNECTIONS = 2;
const MAX_NEXT_CONNECTIONS = 2;

@Injectable({ providedIn: 'root' })
export class DungeonGeneratorService {
  constructor(private campaign: CampaignService) {}

  generateFloor(floorNumber: number): DungeonFloor {
    const config = this.campaign.getDungeonConfig(floorNumber);

    if (config) {
      const rooms = this.normalizeLayeredConnections(
        this.buildFromLayout(config.layout, config.theme, config.roomScenarios),
      );
      return {
        floorNumber,
        theme: config.theme,
        rooms,
        totalRooms: rooms.length,
        bossRoom: rooms.find(r => r.type === 'boss')!.id,
      };
    }

    // Andares sem config definida: geração procedural
    const theme = this.campaign.getTheme(floorNumber);
    const rooms = this.normalizeLayeredConnections(this.generateRooms(floorNumber, theme));
    return {
      floorNumber,
      theme,
      rooms,
      totalRooms: rooms.length,
      bossRoom: rooms.find(r => r.type === 'boss')!.id,
    };
  }

  /** Resolve `RoomType | RoomType[]` para um único RoomType, sorteando quando for array (variedade entre partidas). */
  private resolveRoomType(type: RoomType | RoomType[]): RoomType {
    const resolved = Array.isArray(type) ? type[Math.floor(Math.random() * type.length)] : type;
    return this.maybeMerchant(resolved);
  }

  /** Toda sala de tesouro tem uma chance de virar um ponto de mercador errante. */
  private maybeMerchant(type: RoomType): RoomType {
    if (type === 'treasure' && Math.random() < MERCHANT_CHANCE) return 'merchant';
    return type;
  }

  /**
   * Monta as salas a partir de um layout autorado. Todas as salas começam visíveis
   * (não só a entrada e suas conexões) — o jogador precisa ver a masmorra inteira pra
   * escolher a melhor rota, não só decidir um passo de cada vez no escuro.
   */
  private buildFromLayout(layout: FloorLayout, theme: DungeonTheme, scenarios?: Record<number, RoomScenario>): DungeonRoom[] {
    return layout.rooms.map(r => {
      const type = this.resolveRoomType(r.type);
      return {
        id: r.id,
        type,
        name: r.name,
        description: this.generateRoomDescription(type, theme),
        cleared: type === 'entrance',
        locked: false,
        connections: [...r.connections],
        secretConnections: r.secretConnections ? [...r.secretConnections] : undefined,
        col: r.col,
        row: r.row,
        isVisible: true,
        isCurrent: type === 'entrance',
        entered: type === 'entrance',
        scenario: scenarios?.[r.id],
        requirement: r.requirement,
      };
    });
  }

  private generateRooms(floor: number, theme: DungeonTheme): DungeonRoom[] {
    const rowShape = [
      [0],
      [-1, 1],
      [-2, 0, 2],
      [-3, -1, 1, 3],
      [-2, 0, 2],
      [-1, 1],
      [0],
    ];
    const ROWS = rowShape.length;
    const rooms: DungeonRoom[] = [];
    let id = 0;

    for (let row = 0; row < ROWS; row++) {
      const isEntrance = row === 0;
      const isBoss = row === ROWS - 1;

      for (const col of rowShape[row]) {
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
          // Todas as salas visíveis desde o início — ver comentário em generateFloor().
          isVisible: true,
          isCurrent: isEntrance,
        };
        rooms.push(room);
      }
    }

    this.buildConnections(rooms);

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
      if (roll < acc) return this.maybeMerchant(type as RoomType);
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

  private buildConnections(rooms: DungeonRoom[]): void {
    this.normalizeLayeredConnections(rooms);
  }

  private normalizeLayeredConnections(rooms: DungeonRoom[]): DungeonRoom[] {
    const originalConnections = new Map(rooms.map(r => [r.id, [...r.connections]]));
    const byRow: DungeonRoom[][] = [];
    rooms.forEach(r => {
      if (!byRow[r.row]) byRow[r.row] = [];
      byRow[r.row].push({ ...r, connections: [] });
    });
    byRow.forEach(row => row?.sort((a, b) => a.col - b.col));

    for (let row = 0; row < byRow.length - 1; row++) {
      const current = byRow[row];
      const next = byRow[row + 1];
      if (!current?.length || !next?.length) continue;

      const nextCount = new Map(current.map(r => [r.id, 0]));
      const previousCount = new Map(next.map(r => [r.id, 0]));

      const connect = (src: DungeonRoom, dest: DungeonRoom): boolean => {
        if ((nextCount.get(src.id) ?? 0) >= MAX_NEXT_CONNECTIONS) return false;
        if ((previousCount.get(dest.id) ?? 0) >= MAX_PREVIOUS_CONNECTIONS) return false;
        if (!src.connections.includes(dest.id)) src.connections.push(dest.id);
        if (!dest.connections.includes(src.id)) dest.connections.push(src.id);
        nextCount.set(src.id, (nextCount.get(src.id) ?? 0) + 1);
        previousCount.set(dest.id, (previousCount.get(dest.id) ?? 0) + 1);
        return true;
      };

      const byPreference = (source: DungeonRoom, candidates: DungeonRoom[]) =>
        [...candidates].sort((a, b) => {
          const aWasConnected = originalConnections.get(source.id)?.includes(a.id) ? -1 : 0;
          const bWasConnected = originalConnections.get(source.id)?.includes(b.id) ? -1 : 0;
          return aWasConnected - bWasConnected || Math.abs(a.col - source.col) - Math.abs(b.col - source.col);
        });

      current.forEach(src => {
        for (const dest of byPreference(src, next)) {
          if (connect(src, dest)) break;
        }
      });

      next.forEach(dest => {
        if ((previousCount.get(dest.id) ?? 0) > 0) return;
        for (const src of byPreference(dest, current)) {
          if (connect(src, dest)) break;
        }
      });

      current.forEach(src => {
        if ((nextCount.get(src.id) ?? 0) >= MAX_NEXT_CONNECTIONS) return;
        for (const dest of byPreference(src, next)) {
          if (src.connections.includes(dest.id)) continue;
          if (connect(src, dest)) break;
        }
      });
    }

    const normalized = byRow.flat().sort((a, b) => a.id - b.id);
    rooms.splice(0, rooms.length, ...normalized);
    return rooms;
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
      merchant: ['Posto do Mercador Errante', 'Acampamento de Comércio', 'Tenda do Viajante'],
      hostage:  ['Cela dos Cativos', 'Câmara do Refém', 'Covil dos Captores'],
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
      merchant: 'Um mercador errante oferece seus produtos a quem tiver ouro.',
      hostage:  'Gritos de socorro ecoam — alguém está preso aqui, vigiado por captores.',
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
