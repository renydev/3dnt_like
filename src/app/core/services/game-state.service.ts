import { Injectable, signal, computed } from '@angular/core';
import {
  Character, PRESET_CHARACTERS,
  CharacterClass, CLASS_ROLES,
} from '../models/character.model';
import { DungeonFloor, DungeonRoom, RoomChoiceAction, VALKARIA_FLOORS } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';
import { Enemy } from '../models/combat.model';
import { ALLIHANNA_ROOM_ENEMIES, rollAllihannaEncounter } from '../data/dungeons/allihanna';
import { calcCharacterPP, calcCombatPE } from '../utils/pp-calculator';

function d6() { return Math.ceil(Math.random() * 6); }

export type GameScreen =
  | 'menu'
  | 'character_select'
  | 'character_create'
  | 'companion_select'
  | 'dungeon'
  | 'encounter'
  | 'floor_transition'
  | 'game_over'
  | 'victory'
  | 'debug_map';


@Injectable({ providedIn: 'root' })
export class GameStateService {
  screen = signal<GameScreen>('menu');
  character = signal<Character | null>(null);
  companions = signal<Character[]>([]);
  companionChoices = signal<Omit<Character, 'id'>[]>([]);
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

  /** Diário de combate acumulado durante a run */
  combatJournal = signal<Array<{ ts: string; floor: number; text: string; type: string }>>([]);

  appendJournal(floor: number, text: string, type: string): void {
    this.combatJournal.update(j => [...j, { ts: new Date().toISOString(), floor, text, type }]);
  }

  downloadJournal(): void {
    const name = this.character()?.name ?? 'aventureiro';
    const data = JSON.stringify(this.combatJournal(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diario-${name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
    this.companionChoices.set(this._generateCompanionChoices(char.class));
    this.screen.set('companion_select');
  }

  /** Seleciona um companheiro (tela inicial ou após boss) */
  selectCompanion(choice: Omit<Character, 'id'>): void {
    const companion: Character = { ...choice, id: crypto.randomUUID(), isCompanion: true };
    this.companions.update(list => [...list, companion]);
    this.companionChoices.set([]);
    this.newCompanion.set(companion);

    if (this.screen() === 'companion_select') {
      // Vindo da seleção inicial — entra na dungeon
      const floor = this.currentFloor()!;
      this.addLog(`⚔️ ${this.character()!.name} adentra o Labirinto de Valkaria!`);
      this.addLog(`🤝 ${companion.name} se junta à aventura!`);
      this.addLog(`📍 Andar 1/20 — ${floor.theme.name}`);
      this.addLog(`🏛️ Desafio de ${floor.theme.godName}, ${floor.theme.godDomain}`);
      if (!floor.theme.specialRule.includes('Masmorra mais simples')) {
        this.addLog(`⚠️ REGRA ESPECIAL: ${floor.theme.specialRule}`);
      }
      this.screen.set('dungeon');
    }
    // Se estiver em floor_transition, apenas adiciona — a tela continua mostrando
  }

  /** Gera 3 opções diversas de companheiros (excluindo classe do jogador) */
  private _generateCompanionChoices(playerClass: CharacterClass): Omit<Character, 'id'>[] {
    const pool = PRESET_CHARACTERS.filter(c => c.class !== playerClass);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const seen = new Set<string>();
    const picks: Omit<Character, 'id'>[] = [];
    for (const c of shuffled) {
      const role = CLASS_ROLES[c.class];
      if (!seen.has(role)) {
        seen.add(role);
        picks.push({ ...c, isCompanion: true });
      }
      if (picks.length === 3) break;
    }
    for (const c of shuffled) {
      if (picks.length >= 3) break;
      if (!picks.find(p => p.class === c.class)) {
        picks.push({ ...c, isCompanion: true });
      }
    }
    return picks.slice(0, 3);
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

  /**
   * O grupo descansa na câmara atual.
   * Recupera R×2 PV e R PM por membro. Depois, 1/3 de chance de encontro aleatório.
   * Só pode descansar uma vez por câmara.
   */
  restAtRoom(): void {
    const floor = this.currentFloor();
    const roomId = this.currentRoomId();
    if (!floor) return;

    const room = floor.rooms.find(r => r.id === roomId);
    if (!room || room.rested) return;

    // Cura
    const heal = (c: import('../models/character.model').Character) => {
      const hpGain = c.resistencia.current * 2;
      const pmGain = c.resistencia.current;
      return {
        ...c,
        pontosVida: { ...c.pontosVida, current: Math.min(c.pontosVida.current + hpGain, c.pontosVida.max) },
        pontosMana:  { ...c.pontosMana,  current: Math.min(c.pontosMana.current  + pmGain,  c.pontosMana.max)  },
      };
    };

    this.character.update(c => c ? heal(c) : c);
    this.companions.update(list => list.map(heal));

    // Marca câmara como descansada
    const rooms = floor.rooms.map(r => r.id === roomId ? { ...r, rested: true } : r);
    this.currentFloor.set({ ...floor, rooms });

    this.addLog(`🏕️ O grupo descansou em "${room.name}". PV e PM parcialmente recuperados.`);

    // Rola encontro aleatório (1-2 em 1d6 ≈ 33%)
    const roll = d6();
    if (roll <= 2) {
      const isAllihanna = this.floorNumber() === 1;
      if (isAllihanna) {
        const enemies = rollAllihannaEncounter();
        this.addLog(`⚠️ Encontro aleatório durante o descanso! ${enemies.map(e => e.name).join(', ')} aparecem!`);
        this.pendingEnemies.set(enemies);
      } else {
        this.addLog(`⚠️ Encontro aleatório durante o descanso! Monstros errantes se aproximam!`);
        this.pendingEnemies.set(null);
      }
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

    this.awardFloorCompletionPP();

    if (next > this.TOTAL_FLOORS) {
      this.screen.set('victory');
      this.addLog('🏆 VALKARIA ESTÁ LIVRE! Os aventureiros são os Libertadores de Valkaria!');
      return;
    }

    // A cada boss derrotado, o jogador escolhe um novo companheiro
    const playerClass = this.character()?.class;
    const choices = this._generateCompanionChoices(playerClass ?? 'guerreiro');
    this.companionChoices.set(choices);
    this.newCompanion.set(null);

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

  // ── PE / PP / Level-up ────────────────────────────────────────────────────

  /** PP calculado do personagem principal (usa valor real = base + racial). */
  characterPP = computed(() => {
    const c = this.character();
    return c ? calcCharacterPP(c) : 0;
  });

  /** PP de cada membro da party. */
  partyPPs = computed(() => this.party().map(calcCharacterPP));

  /**
   * Chamado ao fim de um combate com vitória.
   * Distribui PE (Pontos de Experiência) igualmente entre os membros da party,
   * converte PE acumulados em PP (Pontos de Personagem) gastáveis.
   *
   * Regras de PE por monstro vs PP médio da party:
   *   < 0.5× → 0 PE
   *   0.5–1.5× → 1 PE
   *   1.5–2.5× → 2 PE
   *   > 2.5× → floor(ratio × 2) PE
   *
   * PE necessários para 1 PP: 10 PE = 1 ponto de atributo.
   * Terminar a masmorra concede 1 PP extra.
   */
  awardCombatPE(defeatedEnemies: Enemy[], goldAmount: number): void {
    const partyPPs = this.partyPPs();
    if (partyPPs.length === 0) return;

    const monsterPPs = defeatedEnemies.map(e => e.pp);
    const result = calcCombatPE(monsterPPs, partyPPs);
    const pe = result.pePerCharacter;

    if (goldAmount > 0) {
      this.character.update(c => c ? { ...c, gold: c.gold + goldAmount } : c);
    }

    if (pe <= 0) {
      this.addLog(`⚔️ Combate resolvido. Inimigos fracos demais para gerar experiência.`);
      return;
    }

    const PE_PER_PP = 10;

    // Personagem principal
    this.character.update(c => {
      if (!c) return c;
      const oldXp = c.xp;
      const newXp = oldXp + pe;
      const newPP = Math.floor(newXp / PE_PER_PP) - Math.floor(oldXp / PE_PER_PP);
      return {
        ...c,
        xp: newXp,
        levelUpPoints: (c.levelUpPoints ?? 0) + newPP,
      };
    });

    // Companheiros
    this.companions.update(list => list.map(c => {
      const oldXp = c.xp;
      const newXp = oldXp + pe;
      const newPP = Math.floor(newXp / PE_PER_PP) - Math.floor(oldXp / PE_PER_PP);
      return { ...c, xp: newXp, levelUpPoints: (c.levelUpPoints ?? 0) + newPP };
    }));

    this.addLog(`✨ +${pe} PE por personagem (monstros PP total: ${result.totalMonsterPP})`);

    // Verifica novos pontos para o jogador principal
    const char = this.character();
    if (char) {
      const pp = Math.floor(char.xp / PE_PER_PP) - Math.floor((char.xp - pe) / PE_PER_PP);
      if (pp > 0) {
        this.addLog(`🌟 +${pp} PP disponível para distribuir em atributos!`);
      }
    }

    if (goldAmount > 0) {
      this.addLog(`💰 +${goldAmount} PO`);
    }
  }

  /** Concede 1 PP a todos ao completar um andar (chefe derrotado). */
  private awardFloorCompletionPP(): void {
    this.character.update(c => c ? { ...c, levelUpPoints: (c.levelUpPoints ?? 0) + 1 } : c);
    this.companions.update(list => list.map(c => ({ ...c, levelUpPoints: (c.levelUpPoints ?? 0) + 1 })));
    this.addLog(`🏰 Andar concluído! +1 PP para todos os membros da party.`);
  }

  /** @deprecated use awardCombatPE */
  addXp(xpAmount: number, goldAmount: number): void {
    this.character.update(c => c ? { ...c, gold: c.gold + goldAmount } : c);
    this.addLog(`💰 +${goldAmount} PO`);
  }

  /** Custo para ir de N para N+1: N+1 pontos. */
  private attrUpgradeCost(currentBase: number): number { return currentBase + 1; }

  /** Gasta pontos de level-up em um atributo do personagem principal. */
  spendLevelUpPoint(attr: 'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'poderFogo'): void {
    const char = this.character();
    if (!char || !char.levelUpPoints) return;

    const currentBase = attr === 'armadura' ? char.armadura : char[attr].base;
    const racialMod = char.racialMods?.[attr] ?? 0;
    const cost = this.attrUpgradeCost(currentBase - racialMod);
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
        const racialMod = c.racialMods?.[attr] ?? 0;
        const cost = this.attrUpgradeCost(currentBase - racialMod);
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
      pontosMana: { ...c.pontosMana, current: c.pontosMana.max },
    } : c);
    this.companions.update(list => list.map(c => ({
      ...c,
      pontosVida: { ...c.pontosVida, current: c.pontosVida.max },
      pontosMana: { ...c.pontosMana, current: c.pontosMana.max },
    })));
    this.addLog('🛠️ [DEBUG] HP e PM restaurados ao máximo.');
  }

  addLog(msg: string): void {
    this.log.update(l => [...l.slice(-29), msg]);
  }

  goToMenu(): void {
    this.screen.set('menu');
    this.character.set(null);
    this.companions.set([]);
    this.companionChoices.set([]);
    this.newCompanion.set(null);
    this.currentFloor.set(null);
    this.log.set([]);
  }
}
