import { Injectable, signal, computed } from '@angular/core';
import { Character, PRESET_CHARACTERS } from '../models/character.model';
import { DungeonFloor, DungeonRoom } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';

export type GameScreen = 'menu' | 'character_select' | 'dungeon' | 'encounter' | 'game_over' | 'victory';

@Injectable({ providedIn: 'root' })
export class GameStateService {
  // Sinais reativos
  screen = signal<GameScreen>('menu');
  character = signal<Character | null>(null);
  currentFloor = signal<DungeonFloor | null>(null);
  currentRoomId = signal<number>(0);
  floorNumber = signal<number>(1);
  log = signal<string[]>([]);

  currentRoom = computed(() => {
    const floor = this.currentFloor();
    const id = this.currentRoomId();
    return floor?.rooms.find(r => r.id === id) ?? null;
  });

  constructor(private generator: DungeonGeneratorService) {}

  startGame(charIndex: number): void {
    const preset = PRESET_CHARACTERS[charIndex];
    const char: Character = {
      ...preset,
      id: crypto.randomUUID()
    };
    this.character.set(char);
    this.floorNumber.set(1);
    this.generateNewFloor();
    this.screen.set('dungeon');
    this.addLog(`⚔️ ${char.name} entra nas profundezas de Valkaria...`);
    this.addLog(`📍 Andar 1 — ${this.currentFloor()!.theme.name}`);
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

    // Revelar salas conectadas
    const updatedRooms = this.generator.revealConnected(floor.rooms, roomId);
    const movedRooms = this.generator.moveToRoom(updatedRooms, roomId);

    this.currentFloor.set({ ...floor, rooms: movedRooms });
    this.currentRoomId.set(roomId);

    this.addLog(`🚶 Moveu para: ${target.name}`);

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
      this.addLog('💀 O herói caiu nas sombras de Valkaria...');
      return;
    }

    // Marcar sala como limpa
    const updatedRooms = floor.rooms.map(r =>
      r.id === roomId ? { ...r, cleared: true } : r
    );
    this.currentFloor.set({ ...floor, rooms: updatedRooms });
    this.screen.set('dungeon');

    const room = floor.rooms.find(r => r.id === roomId);
    if (result === 'flee') {
      this.addLog(`🏃 Você fugiu de: ${room?.name}`);
    } else {
      this.addLog(`✅ Sala limpa: ${room?.name}`);
      if (room?.type === 'boss') {
        this.nextFloor();
      }
    }
  }

  nextFloor(): void {
    const next = this.floorNumber() + 1;
    if (next > 5) {
      this.screen.set('victory');
      this.addLog('🏆 Você conquistou todas as masmorras de Valkaria!');
    } else {
      this.floorNumber.set(next);
      this.generateNewFloor();
      this.addLog(`📍 Andar ${next} — ${this.currentFloor()!.theme.name}`);
      this.addLog('🔽 Descendo mais fundo nas trevas...');
    }
  }

  addLog(msg: string): void {
    this.log.update(l => [...l.slice(-19), msg]);
  }

  goToMenu(): void {
    this.screen.set('menu');
    this.character.set(null);
    this.currentFloor.set(null);
    this.log.set([]);
  }
}
