import { Injectable, signal, computed } from '@angular/core';
import {
  Character, PRESET_CHARACTERS,
  CharacterClass, CLASS_ROLES,
} from '../models/character.model';
import { Item, ItemSlot, EquipSlot, Equipment, allEquipItems, mergeBonus, equipSlotLabel } from '../models/item.model';
import { DungeonFloor, DungeonRoom, RoomChoiceAction, VALKARIA_FLOORS } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';
import { Enemy } from '../models/combat.model';
import { DUNGEON_REGISTRY } from '../data/dungeons/dungeon-registry';
import { calcCharacterPP, calcCombatXp } from '../utils/pp-calculator';

function d6() { return Math.ceil(Math.random() * 6); }

export type GameScreen =
  | 'menu'
  | 'character_select'
  | 'character_create'
  | 'companion_select'
  | 'dungeon'
  | 'encounter'
  | 'merchant'
  | 'floor_transition'
  | 'game_over'
  | 'victory';


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

  /** True se qualquer membro do grupo possui perícia ou vantagem de detecção de portas secretas */
  partyCanDetectSecrets = computed(() => {
    const DETECTION_PERICIAS = ['investigacao', 'crime'];
    const DETECTION_VANTAGENS = ['sentidos_especiais', 'radar', 'audicao_agucada'];
    const party = [this.character(), ...this.companions()].filter(Boolean) as Character[];
    return party.some(c =>
      c.pericias?.some(p => DETECTION_PERICIAS.includes(p)) ||
      c.vantagens?.some(v => DETECTION_VANTAGENS.includes(v))
    );
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
      this.addLog(`✅ Atravessou a câmara sem conflito.`);
      this._markRoomCleared(roomId);
      if (target.type === 'boss') {
        this.addLog(`🏆 Guardião contornado — o caminho está livre!`);
        this._onBossDefeated();
      }
      return;
    }

    if (action === 'rest_wait') {
      this.addLog(`⏳ O grupo aguarda com paciência. O caminho fica livre.`);
      this._markRoomCleared(roomId);
      return;
    }

    // action === 'enter': triggar encontro normal ou mercador
    if (target.type === 'merchant') {
      this._markRoomCleared(roomId);
      this.screen.set('merchant');
      return;
    }

    // Salas de tesouro são marcadas como limpas ao entrar — impede re-entrada duplicada
    if (target.type === 'treasure') {
      this._markRoomCleared(roomId);
    }

    const config = DUNGEON_REGISTRY[this.floorNumber()];
    const roomGroup = config?.roomEnemies?.[roomId]?.() ?? null;
    this.pendingEnemies.set(roomGroup);
    this.screen.set('encounter');
  }

  private _doMoveToRoom(roomId: number, target: DungeonRoom, floor: DungeonFloor): void {
    const updatedRooms = this.generator.revealConnected(floor.rooms, roomId, this.partyCanDetectSecrets());
    const movedRooms = this.generator.moveToRoom(updatedRooms, roomId);
    this.currentFloor.set({ ...floor, rooms: movedRooms });
    this.currentRoomId.set(roomId);
    this.addLog(`🚶 Avançou para: ${target.name}`);

    if (target.type !== 'entrance' && target.type !== 'empty') {
      if (target.cleared) {
        if (this._rollRandomEncounter()) return;
        return;
      }
    } else if (target.entered) {
      this._rollRandomEncounter();
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

  /** Rola 1d6; se 1, inicia encontro aleatório do andar atual. Retorna true se iniciou. */
  private _rollRandomEncounter(): boolean {
    const roll = d6();
    if (roll !== 1) return false;
    const config = DUNGEON_REGISTRY[this.floorNumber()];
    const enemies = config?.rollEncounter?.() ?? null;
    if (!enemies) return false;
    this.addLog(`⚠️ Encontro aleatório! ${enemies.map(e => e.name).join(', ')} aparecem!`);
    this.pendingEnemies.set(enemies);
    this.screen.set('encounter');
    return true;
  }

  /**
   * Descanso rápido disponível após limpar qualquer sala.
   * Recupera 50% de PV e PM máximos. Sem risco de encontro.
   * Só pode ser feito uma vez por câmara.
   */
  restQuick(): void {
    const floor = this.currentFloor();
    const roomId = this.currentRoomId();
    if (!floor) return;

    const room = floor.rooms.find(r => r.id === roomId);
    if (!room || room.rested) return;

    const heal = (c: import('../models/character.model').Character) => ({
      ...c,
      pontosVida: { ...c.pontosVida, current: Math.min(c.pontosVida.current + Math.ceil(c.pontosVida.max / 2), c.pontosVida.max) },
      pontosMana:  { ...c.pontosMana,  current: Math.min(c.pontosMana.current  + Math.ceil(c.pontosMana.max  / 2), c.pontosMana.max)  },
    });

    this.character.update(c => c ? heal(c) : c);
    this.companions.update(list => list.map(heal));

    const rooms = floor.rooms.map(r => r.id === roomId ? { ...r, rested: true } : r);
    this.currentFloor.set({ ...floor, rooms });

    this.addLog(`💤 Descanso rápido em "${room.name}". Recuperou metade dos PV e PM.`);
  }

  /**
   * Descanso profundo em sala de descanso (tipo 'rest').
   * Recupera PV e PM totalmente. Sem risco de encontro.
   * Só pode ser feito uma vez por câmara.
   */
  restDeep(): void {
    const floor = this.currentFloor();
    const roomId = this.currentRoomId();
    if (!floor) return;

    const room = floor.rooms.find(r => r.id === roomId);
    if (!room || room.rested) return;

    const heal = (c: import('../models/character.model').Character) => ({
      ...c,
      pontosVida: { ...c.pontosVida, current: c.pontosVida.max },
      pontosMana:  { ...c.pontosMana,  current: c.pontosMana.max  },
    });

    this.character.update(c => c ? heal(c) : c);
    this.companions.update(list => list.map(heal));

    const rooms = floor.rooms.map(r => r.id === roomId ? { ...r, rested: true } : r);
    this.currentFloor.set({ ...floor, rooms });

    this.addLog(`🏕️ Descanso profundo em "${room.name}". PV e PM totalmente restaurados!`);
  }

  /** @deprecated use restQuick or restDeep */
  restAtRoom(): void {
    this.restQuick();
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
   * Concede XP a todos os membros da party seguindo a regra oficial do 3D&T Victory:
   *   - combate comum vencido = 1 XP (objetivo menor)
   *   - combate de chefe vencido = 5 XP (objetivo maior)
   *   - inimigos com PP somado ≤ metade do PP da party = 0 XP (longe demais de um desafio)
   *   - inimigos mais fortes que a party rendem XP bônus (1 a cada 10 PP de diferença, máx +5)
   * 10 XP acumulados = 1 PP (Ponto de Personagem) gastável em atributos/vantagens.
   *
   * Terminar a masmorra concede 1 PP extra (awardFloorCompletionPP).
   */
  awardCombatXp(defeatedEnemies: Enemy[], goldAmount: number, isBossFight: boolean): void {
    const partyPPs = this.partyPPs();
    if (partyPPs.length === 0) return;

    const monsterPPs = defeatedEnemies.map(e => e.pp);
    const result = calcCombatXp(monsterPPs, partyPPs, isBossFight);
    const xp = result.xpPerCharacter;
    const PE_PER_PP = 10;

    if (goldAmount > 0) {
      const partySize = 1 + this.companions().length;
      const share = Math.floor(goldAmount / partySize);
      const remainder = goldAmount - share * partySize;
      this.character.update(c => c ? { ...c, gold: c.gold + share + remainder } : c);
      if (share > 0) {
        this.companions.update(list => list.map(c => ({ ...c, gold: c.gold + share })));
      }
      this.addLog(`💰 +${goldAmount} ouro dividido entre ${partySize} personagem${partySize > 1 ? 's' : ''} (+${share + remainder} para ${this.character()?.name}${partySize > 1 ? `, +${share} para cada companheiro` : ''})`);
    }

    if (xp <= 0) {
      this.addLog(`⚔️ Combate resolvido. Inimigos fracos demais para gerar XP.`);
      return;
    }

    // Personagem principal
    this.character.update(c => {
      if (!c) return c;
      const oldXp = c.xp;
      const newXp = oldXp + xp;
      const newPP = Math.floor(newXp / PE_PER_PP) - Math.floor(oldXp / PE_PER_PP);
      return { ...c, xp: newXp, levelUpPoints: (c.levelUpPoints ?? 0) + newPP };
    });

    // Companheiros
    this.companions.update(list => list.map(c => {
      const oldXp = c.xp;
      const newXp = oldXp + xp;
      const newPP = Math.floor(newXp / PE_PER_PP) - Math.floor(oldXp / PE_PER_PP);
      return { ...c, xp: newXp, levelUpPoints: (c.levelUpPoints ?? 0) + newPP };
    }));

    const bonusNote = result.bonusXp > 0 ? ` (+${result.bonusXp} XP bônus por inimigos fortes)` : '';
    this.addLog(`✨ +${xp} XP por personagem${bonusNote} (monstros PP total: ${result.totalMonsterPP})`);

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

  /**
   * Custo para ir de N para N+1 (3D&T Victory): 1PP por ponto até o 5º,
   * 2PP por ponto acima de 5 (equivalente a 20XP/ponto, já que 10XP = 1PP).
   */
  private attrUpgradeCost(currentValue: number): number { return currentValue < 5 ? 1 : 2; }

  /** Gasta pontos de level-up em um atributo do personagem principal. */
  spendLevelUpPoint(attr: 'poder' | 'habilidade' | 'resistencia'): void {
    const char = this.character();
    if (!char || !char.levelUpPoints) return;

    const currentBase = char[attr].base;
    const racialMod = char.racialMods?.[attr] ?? 0;
    const cost = this.attrUpgradeCost(currentBase - racialMod);
    if ((char.levelUpPoints ?? 0) < cost) return;

    const updated = { ...char, levelUpPoints: (char.levelUpPoints ?? 0) - cost };

    if (attr === 'resistencia') {
      const newR = char.resistencia.base + 1;
      updated.resistencia = { base: newR, current: newR, max: newR };
      updated.pontosVida = {
        base: char.pontosVida.base + 5,
        current: char.pontosVida.current + 5,
        max: char.pontosVida.max + 5,
      };
    } else if (attr === 'habilidade') {
      const newH = char.habilidade.base + 1;
      updated.habilidade = { base: newH, current: newH, max: newH };
      updated.pontosMana = {
        base: char.pontosMana.base + 5,
        current: char.pontosMana.current + 5,
        max: char.pontosMana.max + 5,
      };
    } else {
      const old = char[attr];
      const newVal = old.base + 1;
      updated[attr] = { base: newVal, current: newVal, max: newVal } as any;
    }

    this.character.set(updated);
    this.addLog(`📈 ${char.name} melhorou ${attr}! (custou ${cost}PP)`);
  }

  /** Gasta pontos de level-up em um atributo de um companheiro. */
  spendCompanionLevelUpPoint(
    companionId: string,
    attr: 'poder' | 'habilidade' | 'resistencia',
  ): void {
    this.companions.update(list =>
      list.map(c => {
        if (c.id !== companionId || !c.levelUpPoints) return c;
        const currentBase = c[attr].base;
        const racialMod = c.racialMods?.[attr] ?? 0;
        const cost = this.attrUpgradeCost(currentBase - racialMod);
        if ((c.levelUpPoints ?? 0) < cost) return c;
        const updated = { ...c, levelUpPoints: (c.levelUpPoints ?? 0) - cost };
        if (attr === 'resistencia') {
          const newR = c.resistencia.base + 1;
          updated.resistencia = { base: newR, current: newR, max: newR };
          updated.pontosVida = {
            base: c.pontosVida.base + 5,
            current: c.pontosVida.current + 5,
            max: c.pontosVida.max + 5,
          };
        } else if (attr === 'habilidade') {
          const newH = c.habilidade.base + 1;
          updated.habilidade = { base: newH, current: newH, max: newH };
          updated.pontosMana = {
            base: c.pontosMana.base + 5,
            current: c.pontosMana.current + 5,
            max: c.pontosMana.max + 5,
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

  // ── Focos de Magia ────────────────────────────────────────────────────────

  /** Custo para ir de N para N+1 em Focus: N+1 (igual a atributos normais). */
  focusUpgradeCost(current: number): number { return current + 1; }

  spendFocusPoint(path: import('../models/character.model').FocusPath): void {
    const char = this.character();
    if (!char || !char.levelUpPoints) return;
    const focus = char.focus ?? { fogo: 0, agua: 0, ar: 0, terra: 0, luz: 0, trevas: 0 };
    const current = focus[path];
    if (current >= 5) return;
    const cost = this.focusUpgradeCost(current);
    if ((char.levelUpPoints ?? 0) < cost) return;
    this.character.set({
      ...char,
      focus: { ...focus, [path]: current + 1 },
      levelUpPoints: (char.levelUpPoints ?? 0) - cost,
    });
    this.addLog(`🔮 ${char.name} aumentou Focus ${path} para ${current + 1}! (-${cost} PE)`);
  }

  spendCompanionFocusPoint(companionId: string, path: import('../models/character.model').FocusPath): void {
    this.companions.update(list =>
      list.map(c => {
        if (c.id !== companionId || !c.levelUpPoints) return c;
        const focus = c.focus ?? { fogo: 0, agua: 0, ar: 0, terra: 0, luz: 0, trevas: 0 };
        const current = focus[path];
        if (current >= 5) return c;
        const cost = this.focusUpgradeCost(current);
        if ((c.levelUpPoints ?? 0) < cost) return c;
        return {
          ...c,
          focus: { ...focus, [path]: current + 1 },
          levelUpPoints: (c.levelUpPoints ?? 0) - cost,
        };
      })
    );
  }

  // ── Inventário & Equipamento ───────────────────────────────────────────────

  backpackOpen = signal(false);

  addToInventory(item: Item): void {
    this.character.update(c => c ? { ...c, inventory: [...c.inventory, item] } : c);
    this.addLog(`🎒 ${item.icon} ${item.name} na mochila! Abra a mochila para usá-lo.`);
  }

  /** Resolve o EquipSlot real para um item (ring → ring_left ou ring_right). */
  private _resolveEquipSlot(item: Item): EquipSlot {
    if (item.slot === 'ring') {
      const eq = this.character()?.equipment ?? {};
      if (!eq.ring_left)  return 'ring_left';
      if (!eq.ring_right) return 'ring_right';
      return 'ring_left';
    }
    return item.slot as EquipSlot;
  }

  private _equipDirect(item: Item, targetSlot: EquipSlot): void {
    this.character.update(c => {
      if (!c) return c;
      const eq: Equipment = { ...c.equipment };
      let inv = c.inventory.filter(i => i !== item);

      // Arma de 2 mãos → limpa offhand
      if (targetSlot === 'weapon' && item.twoHanded && eq.offhand) {
        inv = [...inv, eq.offhand]; eq.offhand = undefined;
      }
      // Offhand enquanto há arma de 2 mãos → remove a arma
      if (targetSlot === 'offhand' && eq.weapon?.twoHanded) {
        inv = [...inv, eq.weapon]; eq.weapon = undefined;
      }
      // Luvas → remove anéis
      if (targetSlot === 'gloves') {
        if (eq.ring_left)  { inv = [...inv, eq.ring_left];  eq.ring_left  = undefined; }
        if (eq.ring_right) { inv = [...inv, eq.ring_right]; eq.ring_right = undefined; }
      }
      // Anel → remove luvas
      if (targetSlot === 'ring_left' || targetSlot === 'ring_right') {
        if (eq.gloves) { inv = [...inv, eq.gloves]; eq.gloves = undefined; }
      }

      const prev = (eq as any)[targetSlot] as Item | undefined;
      if (prev) inv = [...inv, prev];
      (eq as any)[targetSlot] = item;

      const bonus = mergeBonus(...allEquipItems(eq));
      const pvMax = c.resistencia.base * 5 + (bonus.pontosVida ?? 0);
      const pmMax = c.pontosMana.base     + (bonus.pontosMana ?? 0);
      return {
        ...c,
        equipment: eq,
        inventory: inv,
        pontosVida: { ...c.pontosVida, max: pvMax, current: Math.min(c.pontosVida.current, pvMax) },
        pontosMana: { ...c.pontosMana, max: pmMax, current: Math.min(c.pontosMana.current, pmMax) },
      };
    });
  }

  equipItem(item: Item): void {
    if (!item.slot) return;
    const targetSlot = this._resolveEquipSlot(item);
    this._equipDirect(item, targetSlot);
    this.addLog(`🔧 ${item.icon} ${item.name} equipado (${equipSlotLabel(targetSlot)}).`);
  }

  unequipItem(slot: EquipSlot): void {
    this.character.update(c => {
      if (!c) return c;
      const item = (c.equipment as any)[slot] as Item | undefined;
      if (!item) return c;
      const eq: Equipment = { ...c.equipment, [slot]: undefined };
      const bonus = mergeBonus(...allEquipItems(eq));
      const pvMax = c.resistencia.base * 5 + (bonus.pontosVida ?? 0);
      const pmMax = c.pontosMana.base     + (bonus.pontosMana ?? 0);
      return {
        ...c,
        equipment: eq,
        inventory: [...c.inventory, item],
        pontosVida: { ...c.pontosVida, max: pvMax, current: Math.min(c.pontosVida.current, pvMax) },
        pontosMana: { ...c.pontosMana, max: pmMax, current: Math.min(c.pontosMana.current, pmMax) },
      };
    });
  }

  useConsumable(item: Item): boolean {
    const c = this.character();
    if (!c) return false;
    const idx = c.inventory.findIndex(i => i.id === item.id);
    if (idx === -1) return false;

    let pvGain = 0;
    let pmGain = 0;

    if ((item.healPvDice ?? 0) > 0 || (item.healPvFlat ?? 0) > 0) {
      let roll = 0;
      for (let i = 0; i < (item.healPvDice ?? 0); i++) roll += d6();
      pvGain = Math.min(roll + (item.healPvFlat ?? 0), c.pontosVida.max - c.pontosVida.current);
      pvGain = Math.max(0, pvGain);
    }
    if ((item.healPmDice ?? 0) > 0 || (item.healPmFlat ?? 0) > 0) {
      let roll = 0;
      for (let i = 0; i < (item.healPmDice ?? 0); i++) roll += d6();
      pmGain = Math.min(roll + (item.healPmFlat ?? 0), c.pontosMana.max - c.pontosMana.current);
      pmGain = Math.max(0, pmGain);
    }

    const newInv = [...c.inventory];
    newInv.splice(idx, 1);

    this.character.update(ch => ch ? {
      ...ch,
      inventory: newInv,
      pontosVida: { ...ch.pontosVida, current: ch.pontosVida.current + pvGain },
      pontosMana: { ...ch.pontosMana, current: ch.pontosMana.current + pmGain },
    } : ch);

    const parts: string[] = [];
    if (pvGain > 0) parts.push(`+${pvGain} PV`);
    if (pmGain > 0) parts.push(`+${pmGain} PM`);
    this.addLog(`${item.icon} Usou ${item.name}${parts.length ? ` — ${parts.join(', ')}` : ''}`);
    return true;
  }

  /** Compra um item do mercador. Deduz ouro e adiciona ao inventário. */
  buyItem(item: Item): boolean {
    const c = this.character();
    if (!c) return false;
    const price = item.price ?? 0;
    if (c.gold < price) return false;
    this.character.update(ch => ch ? { ...ch, gold: ch.gold - price, inventory: [...ch.inventory, { ...item }] } : ch);
    this.addLog(`🛒 Comprou ${item.icon} ${item.name} por ${price} PO`);
    return true;
  }

  /** Vende um item do inventário por metade do preço. */
  sellItem(item: Item, sellPrice: number): void {
    this.character.update(c => {
      if (!c) return c;
      const idx = c.inventory.findIndex(i => i.id === item.id);
      if (idx === -1) return c;
      const newInv = [...c.inventory];
      newInv.splice(idx, 1);
      return { ...c, inventory: newInv, gold: c.gold + sellPrice };
    });
    this.addLog(`💸 Vendeu ${item.icon} ${item.name} por ${sellPrice} PO`);
  }

  closeMerchant(): void {
    this.screen.set('dungeon');
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
