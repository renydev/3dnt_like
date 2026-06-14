import { Injectable, signal, computed } from '@angular/core';
import {
  Character, PRESET_CHARACTERS, COMPANION_POOL,
  CharacterClass, CLASS_ROLES, ROLE_COMPLEMENTS,
} from '../models/character.model';
import { DungeonFloor, DungeonRoom, RoomChoiceAction, VALKARIA_FLOORS } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';
import { Enemy } from '../models/combat.model';
import { ALLIHANNA_ROOM_ENEMIES, rollAllihannaEncounter } from '../data/dungeons/allihanna';

function d6() { return Math.ceil(Math.random() * 6); }

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

  /** Grupo de inimigos para o próximo combate (null = usar geração procedural) */
  pendingEnemies = signal<Enemy[] | null>(null);

  /** ID da câmara aguardando confirmação do dialog de cenário */
  pendingRoomEntry = signal<number | null>(null);

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
    this.companions.set(this._buildInitialParty(char.class));
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

  /**
   * Monta a party inicial com 3 companheiros IA que equilibram o papel do jogador.
   * Tank → DPS + Healer + Mage, etc.
   */
  private _buildInitialParty(playerClass: CharacterClass): Character[] {
    const playerRole = CLASS_ROLES[playerClass];
    const needed = ROLE_COMPLEMENTS[playerRole];

    return needed.map(role => {
      // Pega o primeiro personagem do pool com esse papel que não seja a classe do jogador
      const preset = PRESET_CHARACTERS.find(
        c => CLASS_ROLES[c.class] === role && c.class !== playerClass
      ) ?? PRESET_CHARACTERS.find(c => CLASS_ROLES[c.class] === role)!;
      return { ...preset, id: crypto.randomUUID(), isCompanion: true };
    });
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

    // Câmaras não triviais não limpas abrem o dialog de cenário
    if (target.type !== 'entrance' && target.type !== 'empty' && !target.cleared) {
      this.pendingRoomEntry.set(roomId);
      return;
    }

    this._doMoveToRoom(roomId, target, floor);
  }

  confirmRoomEntry(action: RoomChoiceAction): void {
    const roomId = this.pendingRoomEntry();
    this.pendingRoomEntry.set(null);
    if (roomId === null) return;

    if (action === 'flee') return;

    const floor = this.currentFloor();
    const target = floor?.rooms.find(r => r.id === roomId);
    if (!target || !floor) return;

    this._doMoveToRoom(roomId, target, floor);

    if (action === 'safe_enter') {
      // Atravessou sem conflito (ex.: acalmar animais)
      this.addLog(`✅ Atravessou a câmara sem conflito.`);
      this._markRoomCleared(roomId);
      return;
    }

    if (action === 'rest_wait') {
      this.addLog(`⏳ O grupo aguarda com paciência. O caminho fica livre.`);
      this._markRoomCleared(roomId);
      return;
    }

    // action === 'enter': triggar encontro normal
    const roomGroup = this.floorNumber() === 1 && ALLIHANNA_ROOM_ENEMIES[roomId]
      ? ALLIHANNA_ROOM_ENEMIES[roomId]()
      : null;
    this.pendingEnemies.set(roomGroup);
    this.screen.set('encounter');
  }

  private _doMoveToRoom(roomId: number, target: DungeonRoom, floor: DungeonFloor): void {
    const updatedRooms = this.generator.revealConnected(floor.rooms, roomId);
    const movedRooms = this.generator.moveToRoom(updatedRooms, roomId);
    this.currentFloor.set({ ...floor, rooms: movedRooms });
    this.currentRoomId.set(roomId);
    this.addLog(`🚶 Avançou para: ${target.name}`);

    if (target.type !== 'entrance' && target.type !== 'empty') {
      if (target.cleared) {
        if (this.floorNumber() === 1 && this._rollAllihannaRandom()) return;
        return;
      }
    } else if (target.entered && this.floorNumber() === 1) {
      this._rollAllihannaRandom();
    }
  }

  private _markRoomCleared(roomId: number): void {
    const floor = this.currentFloor();
    if (!floor) return;
    const rooms = floor.rooms.map(r =>
      r.id === roomId ? { ...r, cleared: true } : r
    );
    this.currentFloor.set({ ...floor, rooms });
  }

  /** Rola 1d6; se 1, inicia encontro aleatório de Allihanna. Retorna true se iniciou. */
  private _rollAllihannaRandom(): boolean {
    const roll = d6();
    if (roll !== 1) return false;
    const enemies = rollAllihannaEncounter();
    this.addLog(`⚠️ Encontro aleatório! ${enemies.map(e => e.name).join(', ')} aparecem!`);
    this.pendingEnemies.set(enemies);
    this.screen.set('encounter');
    return true;
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

  // ── XP / Level-up ─────────────────────────────────────────────────────────

  /**
   * Chamado pelo CombatService ao matar um inimigo.
   * Cada 10 XP acumulados = 1 ponto distribuível em atributos.
   */
  addXp(xpAmount: number, goldAmount: number): void {
    const char = this.character();
    if (!char) return;

    const oldXp = char.xp;
    const newXp = oldXp + xpAmount;
    const newPoints = Math.floor(newXp / 10) - Math.floor(oldXp / 10);

    this.character.update(c => c ? {
      ...c,
      xp: newXp,
      gold: c.gold + goldAmount,
      levelUpPoints: (c.levelUpPoints ?? 0) + newPoints,
    } : c);

    this.addLog(`✨ +${xpAmount} XP, +${goldAmount} PO`);
    if (newPoints > 0) {
      this.addLog(`🌟 +${newPoints} ponto${newPoints > 1 ? 's' : ''} de atributo disponível!`);
    }
  }

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

  /** Custo para ir de N para N+1: N+1 pontos. */
  private attrUpgradeCost(currentBase: number): number { return currentBase + 1; }

  /** Gasta pontos de level-up em um atributo do personagem principal. */
  spendLevelUpPoint(attr: 'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'poderFogo'): void {
    const char = this.character();
    if (!char || !char.levelUpPoints) return;

    const currentBase = attr === 'armadura' ? char.armadura : char[attr].base;
    const cost = this.attrUpgradeCost(currentBase);
    if ((char.levelUpPoints ?? 0) < cost) return;

    const updated = { ...char, levelUpPoints: (char.levelUpPoints ?? 0) - cost };

    if (attr === 'armadura') {
      updated.armadura = char.armadura + 1;
    } else if (attr === 'resistencia') {
      const newR = char.resistencia.base + 1;
      updated.resistencia = { base: newR, current: newR, max: newR };
      updated.pontosVida = {
        base: char.pontosVida.base + 5,
        current: char.pontosVida.current + 5,
        max: char.pontosVida.max + 5,
      };
    } else {
      const old = char[attr];
      const newVal = old.base + 1;
      updated[attr] = { base: newVal, current: newVal, max: newVal } as any;
    }

    this.character.set(updated);
    this.addLog(`📈 ${char.name} melhorou ${attr}! (custou ${cost}pt)`);
  }

  /** Gasta pontos de level-up em um atributo de um companheiro. */
  spendCompanionLevelUpPoint(
    companionId: string,
    attr: 'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'poderFogo',
  ): void {
    this.companions.update(list =>
      list.map(c => {
        if (c.id !== companionId || !c.levelUpPoints) return c;
        const currentBase = attr === 'armadura' ? c.armadura : c[attr].base;
        const cost = this.attrUpgradeCost(currentBase);
        if ((c.levelUpPoints ?? 0) < cost) return c;
        const updated = { ...c, levelUpPoints: (c.levelUpPoints ?? 0) - cost };
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

  // ── Debug ──────────────────────────────────────────────────────────────────

  /** Teleporta para um andar específico mantendo o personagem atual. */
  debugJumpToFloor(floorNumber: number): void {
    this.pendingEnemies.set(null);
    this.newCompanion.set(null);
    this.floorNumber.set(floorNumber);
    this.generateNewFloor();
    const theme = this.currentFloor()!.theme;
    this.screen.set('dungeon');
    this.addLog(`🛠️ [DEBUG] Teleportado para Andar ${floorNumber} — ${theme.name}`);
  }

  /** Restaura HP e PF máximos do personagem e companheiros. */
  debugFullHeal(): void {
    this.character.update(c => c ? {
      ...c,
      pontosVida: { ...c.pontosVida, current: c.pontosVida.max },
      poderFogo:  { ...c.poderFogo,  current: c.poderFogo.max  },
    } : c);
    this.companions.update(list => list.map(c => ({
      ...c,
      pontosVida: { ...c.pontosVida, current: c.pontosVida.max },
      poderFogo:  { ...c.poderFogo,  current: c.poderFogo.max  },
    })));
    this.addLog('🛠️ [DEBUG] HP e PF restaurados ao máximo.');
  }

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
