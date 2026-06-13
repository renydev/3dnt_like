import { Injectable, signal, computed } from '@angular/core';
import { Character, PRESET_CHARACTERS, COMPANION_POOL } from '../models/character.model';
import { DungeonFloor, DungeonRoom, VALKARIA_FLOORS } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';

export type GameScreen =
  | 'menu'
  | 'character_select'
  | 'character_create'
  | 'dungeon'
  | 'encounter'
  | 'floor_transition'
  | 'game_over'
  | 'victory'
  | 'debug_map';

// Andares em que companheiros se juntam ao grupo (após derrotar o chefe)
const COMPANION_JOIN_FLOORS: Record<number, number> = { 3: 0, 7: 1, 12: 2 };

@Injectable({ providedIn: 'root' })
export class GameStateService {
  screen = signal<GameScreen>('menu');
  character = signal<Character | null>(null);
  companions = signal<Character[]>([]);
  currentFloor = signal<DungeonFloor | null>(null);
  currentRoomId = signal<number>(0);
  floorNumber = signal<number>(1);
  log = signal<string[]>([]);

  /** Companheiro que acabou de se juntar (exibido na transição) */
  newCompanion = signal<Character | null>(null);

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

  nextTheme = computed(() => {
    const n = this.floorNumber();
    const next = n; // floorNumber já foi incrementado ao entrar em floor_transition
    return VALKARIA_FLOORS[Math.min(next, VALKARIA_FLOORS.length - 1)] ?? null;
  });

  progressPercent = computed(() =>
    Math.round(((this.floorNumber() - 1) / this.TOTAL_FLOORS) * 100)
  );

  /** Todos os personagens da party (jogador + companheiros) */
  party = computed(() => {
    const char = this.character();
    return char ? [char, ...this.companions()] : [];
  });

  constructor(private generator: DungeonGeneratorService) {}

  // ── Início de jogo ─────────────────────────────────────────────────────────

  startGame(charIndex: number): void {
    const preset = PRESET_CHARACTERS[charIndex];
    this.startCustomGame({ ...preset, id: crypto.randomUUID() });
  }

  startCustomGame(char: Character): void {
    this.character.set(char);
    this.companions.set([]);
    this.newCompanion.set(null);
    this.floorNumber.set(1);
    this.generateNewFloor();
    this.screen.set('dungeon');
    this.addLog(`⚔️ ${char.name} adentra o Labirinto de Valkaria!`);
    this.addLog(`📍 Andar 1/20 — ${this.currentFloor()!.theme.name}`);
    this.addLog(`🏛️ Desafio de ${this.currentFloor()!.theme.godName}, ${this.currentFloor()!.theme.godDomain}`);
    if (!this.currentFloor()!.theme.specialRule.includes('Masmorra mais simples')) {
      this.addLog(`⚠️ REGRA ESPECIAL: ${this.currentFloor()!.theme.specialRule}`);
    }
  }

  // ── Andares ────────────────────────────────────────────────────────────────

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
        this._onBossDefeated();
      }
    }
  }

  private _onBossDefeated(): void {
    const current = this.floorNumber();
    const next = current + 1;

    if (next > this.TOTAL_FLOORS) {
      this.screen.set('victory');
      this.addLog('🏆 VALKARIA ESTÁ LIVRE! Os aventureiros são os Libertadores de Valkaria!');
      return;
    }

    // Verifica se um companheiro se junta neste andar
    const companionIdx = COMPANION_JOIN_FLOORS[current];
    if (companionIdx !== undefined && companionIdx < COMPANION_POOL.length) {
      const companion: Character = { ...COMPANION_POOL[companionIdx], id: crypto.randomUUID() };
      this.companions.update(list => [...list, companion]);
      this.newCompanion.set(companion);
      this.addLog(`🤝 ${companion.name} se junta ao grupo!`);
    } else {
      this.newCompanion.set(null);
    }

    this.floorNumber.set(next);
    this.screen.set('floor_transition');
  }

  proceedToNextFloor(): void {
    this.generateNewFloor();
    const theme = this.currentFloor()!.theme;
    this.addLog(`📍 Andar ${this.floorNumber()}/20 — ${theme.name}`);
    this.addLog(`🏛️ Desafio de ${theme.godName}, ${theme.godDomain}`);
    if (!theme.specialRule.includes('Masmorra mais simples')) {
      this.addLog(`⚠️ ${theme.specialRule}`);
    }
    this.screen.set('dungeon');
  }

  // ── Level-up ───────────────────────────────────────────────────────────────

  /** Concede XP ao personagem principal e verifica subida de nível. */
  grantXp(amount: number): void {
    const char = this.character();
    if (!char) return;
    const newXp = char.xp + amount;
    const toNext = char.xpToNextLevel;

    if (newXp >= toNext) {
      const leveled: Character = {
        ...char,
        level: char.level + 1,
        xp: newXp - toNext,
        xpToNextLevel: Math.round(toNext * 1.5),
        levelUpPoints: (char.levelUpPoints ?? 0) + 3,
      };
      this.character.set(leveled);
      this.addLog(`🌟 ${char.name} subiu para o Nível ${leveled.level}! +3 pontos para distribuir.`);
    } else {
      this.character.set({ ...char, xp: newXp });
    }
  }

  /** Gasta 1 ponto de level-up em um atributo do personagem principal. */
  spendLevelUpPoint(attr: 'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'pontosMagia'): void {
    const char = this.character();
    if (!char || !char.levelUpPoints) return;

    const updated = { ...char, levelUpPoints: char.levelUpPoints - 1 };

    if (attr === 'armadura') {
      updated.armadura = char.armadura + 1;
    } else if (attr === 'resistencia') {
      const newR = char.resistencia.base + 1;
      const pvBonus = 5;
      updated.resistencia = { base: newR, current: newR, max: newR };
      updated.pontosVida = {
        base: char.pontosVida.base + pvBonus,
        current: char.pontosVida.current + pvBonus,
        max: char.pontosVida.max + pvBonus,
      };
    } else {
      const old = char[attr];
      const newVal = old.base + 1;
      updated[attr] = { base: newVal, current: newVal, max: newVal } as any;
    }

    this.character.set(updated);
    this.addLog(`📈 ${char.name} melhorou ${attr}!`);
  }

  /** Gasta 1 ponto de level-up em um atributo de um companheiro. */
  spendCompanionLevelUpPoint(
    companionId: string,
    attr: 'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'pontosMagia',
  ): void {
    this.companions.update(list =>
      list.map(c => {
        if (c.id !== companionId || !c.levelUpPoints) return c;
        const updated = { ...c, levelUpPoints: c.levelUpPoints - 1 };
        if (attr === 'armadura') {
          updated.armadura = c.armadura + 1;
        } else if (attr === 'resistencia') {
          const newR = c.resistencia.base + 1;
          updated.resistencia = { base: newR, current: newR, max: newR };
          updated.pontosVida = {
            base: c.pontosVida.base + 5,
            current: c.pontosVida.current + 5,
            max: c.pontosVida.max + 5,
          };
        } else {
          const old = c[attr];
          const newVal = old.base + 1;
          (updated as any)[attr] = { base: newVal, current: newVal, max: newVal };
        }
        return updated;
      })
    );
  }

  // ── Utilitários ────────────────────────────────────────────────────────────

  addLog(msg: string): void {
    this.log.update(l => [...l.slice(-29), msg]);
  }

  goToMenu(): void {
    this.screen.set('menu');
    this.character.set(null);
    this.companions.set([]);
    this.currentFloor.set(null);
    this.log.set([]);
  }
}
