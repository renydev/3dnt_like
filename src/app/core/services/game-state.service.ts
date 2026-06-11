import { Injectable, signal, computed } from '@angular/core';
import { Character, PRESET_CHARACTERS } from '../models/character.model';
import { DungeonFloor, DungeonRoom, VALKARIA_FLOORS } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';

export type GameScreen = 'menu' | 'character_select' | 'character_create' | 'dungeon' | 'encounter' | 'game_over' | 'victory';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  screen = signal<GameScreen>('menu');
  character = signal<Character | null>(null);
  currentFloor = signal<DungeonFloor | null>(null);
  currentRoomId = signal<number>(0);
  floorNumber = signal<number>(1);
  log = signal<string[]>([]);

  readonly TOTAL_FLOORS = 20;

  currentRoom = computed(() => {
    const floor = this.currentFloor();
    const id = this.currentRoomId();
    return floor?.rooms.find(r => r.id === id) ?? null;
  });

  currentTheme = computed(() => {
    const n = this.floorNumber();
    return VALKARIA_FLOORS[Math.min(n - 1, VALKARIA_FLOORS.length - 1)];
  });

  progressPercent = computed(() =>
    Math.round(((this.floorNumber() - 1) / this.TOTAL_FLOORS) * 100)
  );

  constructor(private generator: DungeonGeneratorService) {}

  startGame(charIndex: number): void {
    const preset = PRESET_CHARACTERS[charIndex];
    this.startCustomGame({ ...preset, id: crypto.randomUUID() });
  }

  startCustomGame(char: Character): void {
    this.character.set(char);
    this.floorNumber.set(1);
    this.generateNewFloor();
    this.screen.set('dungeon');
    this.addLog(`⚔️ ${char.name} adentra o Labirinto de Valkaria!`);
    this.addLog(`📍 Andar 1/20 — ${this.currentFloor()!.theme.name}`);
    this.addLog(`🏛️ Desafio de ${this.currentFloor()!.theme.godName}, ${this.currentFloor()!.theme.godDomain}`);
    if (this.currentFloor()!.theme.specialRule !== 'Masmorra mais simples — sem regras especiais. Combate direto.') {
      this.addLog(`⚠️ REGRA ESPECIAL: ${this.currentFloor()!.theme.specialRule}`);
    }
  }

  generateNewFloor(): void {
    const floor = this.generator.generateFloor(this.floorNumber());
    this.currentFloor.set(floor);
    const entrance = floor.rooms.find(r => r.type === 'entrance')!;
    this.currentRoomId.set(entrance.id);
  }

  moveToRoom(roomId: number): void {
    const floor = this.currentFloor();
    if (!floor) return;

    const target = floor.rooms.find(r => r.id === roomId);
    if (!target || !target.isVisible) return;

    const updatedRooms = this.generator.revealConnected(floor.rooms, roomId);
    const movedRooms = this.generator.moveToRoom(updatedRooms, roomId);

    this.currentFloor.set({ ...floor, rooms: movedRooms });
    this.currentRoomId.set(roomId);
    this.addLog(`🚶 Avançou para: ${target.name}`);

    if (target.type !== 'entrance' && target.type !== 'empty') {
      this.screen.set('encounter');
    }
  }

  resolveEncounter(result: 'victory' | 'flee' | 'defeat'): void {
    const floor = this.currentFloor();
    const roomId = this.currentRoomId();
    if (!floor) return;

    if (result === 'defeat') {
      this.screen.set('game_over');
      this.addLog('💀 O herói caiu nas profundezas do Labirinto de Valkaria...');
      this.addLog(`📊 Chegou ao Andar ${this.floorNumber()}/20 — Desafio de ${floor.theme.godName}`);
      return;
    }

    const updatedRooms = floor.rooms.map(r =>
      r.id === roomId ? { ...r, cleared: true } : r
    );
    this.currentFloor.set({ ...floor, rooms: updatedRooms });
    this.screen.set('dungeon');

    const room = floor.rooms.find(r => r.id === roomId);
    if (result === 'flee') {
      this.addLog(`🏃 Fugiu de: ${room?.name}`);
    } else {
      this.addLog(`✅ Venceu: ${room?.name}`);
      if (room?.type === 'boss') {
        this.addLog(`🏆 Guardião derrotado: ${floor.theme.guardianName}!`);
        this.nextFloor();
      }
    }
  }

  nextFloor(): void {
    const next = this.floorNumber() + 1;
    if (next > this.TOTAL_FLOORS) {
      this.screen.set('victory');
      this.addLog('🏆 VALKARIA ESTÁ LIVRE! Os aventureiros são os Libertadores de Valkaria!');
      this.addLog('👑 Título concedido: Escolhido dos Deuses!');
    } else {
      this.floorNumber.set(next);
      this.generateNewFloor();
      const theme = this.currentFloor()!.theme;
      this.addLog(`📍 Andar ${next}/20 — ${theme.name}`);
      this.addLog(`🏛️ Desafio de ${theme.godName}, ${theme.godDomain}`);
      if (!theme.specialRule.includes('Masmorra mais simples')) {
        this.addLog(`⚠️ ${theme.specialRule}`);
      }
    }
  }

  addLog(msg: string): void {
    this.log.update(l => [...l.slice(-29), msg]);
  }

  goToMenu(): void {
    this.screen.set('menu');
    this.character.set(null);
    this.currentFloor.set(null);
    this.log.set([]);
  }
}
