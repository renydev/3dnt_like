import { Injectable, signal, computed } from '@angular/core';
import {
  Character, PRESET_CHARACTERS,
} from '../models/character.model';
import { Item, ItemSlot, EquipSlot, Equipment, allEquipItems, mergeBonus, equipSlotLabel } from '../models/item.model';
import { DungeonFloor, DungeonRoom, RoomChoice, RoomChoiceAction, RoomRequirement, StoryEffect } from '../models/dungeon.model';
import { DungeonGeneratorService } from './dungeon-generator.service';
import { Enemy } from '../models/combat.model';
import { CampaignService } from './campaign.service';
import type { SaveGameData } from '../models/save-game.model';
import {
  calcCharacterPP, classifyCombatRisk, CombatVerdict, computeGrowthScale, GrowthScale, VERDICT_XP,
} from '../utils/pp-calculator';

function d6() { return Math.ceil(Math.random() * 6); }
const SAVE_KEY = '3dnt_like.currentRun.v1';

/** Resumo da recompensa de um combate, exibido ao jogador ao final da batalha. */
export interface CombatRewardSummary {
  xpPerCharacter: number;
  isBossFight: boolean;
  /** Veredito de risco do combate (trivial/equilibrado/arriscado/mortal) — define o XP fixo concedido. */
  verdict: CombatVerdict;
  goldAmount: number;
  /** Motivo de não ter ganho XP (null se ganhou). */
  reason: string | null;
}

export type GameScreen =
  | 'menu'
  | 'character_select'
  | 'character_create'
  | 'dungeon'
  | 'encounter'
  | 'merchant'
  | 'floor_transition'
  | 'game_over'
  | 'victory';


@Injectable({ providedIn: 'root' })
export class GameStateService {
  screen = signal<GameScreen>('menu');
  hasSavedRun = signal<boolean>(this._hasSavedRun());
  character = signal<Character | null>(null);
  companions = signal<Character[]>([]);
  currentFloor = signal<DungeonFloor | null>(null);
  currentRoomId = signal<number>(0);
  floorNumber = signal<number>(1);
  /**
   * Fator de crescimento dos monstros curados do andar atual (1.0 = curva esperada
   * em todos os eixos). `computed()`, não `signal()` — recalcula automaticamente
   * sempre que a party muda (subiu de PP/atributo no meio do andar), em vez de
   * ficar "congelado" no valor de quando o andar foi gerado. Como o PP só sobe
   * durante uma run normal, a escala só pode subir ou ficar igual dentro do mesmo
   * andar — sem o "ioiô" de dificuldade que uma recalculação bidirecional teria.
   */
  floorGrowthScale = computed<GrowthScale>(() => {
    const party = this.party();
    const size = party.length || 1;
    // computeGrowthScale() espera PP médio POR PERSONAGEM (mesma convenção de
    // growthScale()/tierForPP() — 10/20/35) — usar a soma aqui é o mesmo bug
    // recorrente já corrigido em generateNewFloor(), só que reintroduzido nesta
    // outra função (que passou a recalcular via computed() em vez do signal antigo).
    const partyPP = this.partyPPs().reduce((s, p) => s + p, 0) / size;
    const avgAttrs = {
      poder:       party.reduce((s, c) => s + c.poder.current, 0)       / size,
      habilidade:  party.reduce((s, c) => s + c.habilidade.current, 0)  / size,
      resistencia: party.reduce((s, c) => s + c.resistencia.current, 0) / size,
    };
    return computeGrowthScale(partyPP, avgAttrs, size, this.floorNumber());
  });
  log = signal<string[]>([]);

  /** Companheiro que acabou de se juntar (exibido na transição) */
  newCompanion = signal<Character | null>(null);

  /**
   * Quantos encontros de combate já ocorreram no andar atual — usado para a chance
   * crescente de recrutar um companheiro (ver _maybeRecruitCompanion). Reseta a
   * cada novo andar.
   */
  floorEncounterCount = signal<number>(0);

  /**
   * Já apareceu um companheiro neste andar? Uma vez true, para de rolar a chance
   * pelo resto do andar (é "uma possibilidade por masmorra", não um teste repetido
   * sem limite). Reseta a cada novo andar.
   */
  companionFoundThisFloor = signal<boolean>(false);

  /** Grupo de inimigos para o próximo combate (null = usar geração procedural) */
  pendingEnemies = signal<Enemy[] | null>(null);

  /** ID da câmara aguardando confirmação do dialog de cenário */
  pendingRoomEntry = signal<number | null>(null);
  narrativeFlags = signal<Record<string, string | number | boolean>>({});

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

  get TOTAL_FLOORS(): number {
    return this.campaign.totalFloors();
  }

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

  /** True se algum membro do grupo satisfaz a exigência de acesso de uma sala (perícia/atributo/item). */
  meetsRoomRequirement(requirement: RoomRequirement): boolean {
    const party = [this.character(), ...this.companions()].filter(Boolean) as Character[];
    return party.some(c => {
      switch (requirement.type) {
        case 'pericia':
          return !!c.pericias?.includes(requirement.pericia!);
        case 'atributo':
          return c[requirement.atributo!].current >= (requirement.minValue ?? 0);
        case 'item':
          return c.inventory.some(i => i.id === requirement.itemId)
            || Object.values(c.equipment).some(i => i?.id === requirement.itemId);
      }
    });
  }

  currentTheme = computed(() => {
    const n = this.floorNumber();
    return this.campaign.getTheme(n);
  });

  nextTheme = computed(() => {
    const n = this.floorNumber();
    return this.campaign.getNextTheme(n);
  });

  progressPercent = computed(() =>
    Math.round(((this.floorNumber() - 1) / this.TOTAL_FLOORS) * 100)
  );

  /** Todos os personagens da party (jogador + companheiros) */
  party = computed(() => {
    const char = this.character();
    return char ? [char, ...this.companions()] : [];
  });

  constructor(private generator: DungeonGeneratorService, public campaign: CampaignService) {}

  // ── Início de jogo ─────────────────────────────────────────────────────────

  startGame(charIndex: number): void {
    const preset = PRESET_CHARACTERS[charIndex];
    this.startCustomGame({ ...preset, id: crypto.randomUUID() });
  }

  startCustomGame(char: Character): void {
    this.character.set(char);
    this.companions.set([]);
    this.newCompanion.set(null);
    this.narrativeFlags.set({});
    this.floorNumber.set(1);
    this.generateNewFloor();

    const floor = this.currentFloor()!;
    const texts = this.campaign.activeCampaign().texts;
    this.addLog(this.campaign.format(texts.runStart, { hero: char.name }));
    this.addLog(this.campaign.floorText(texts.floorLog, 1));
    this.addLog(this.campaign.floorText(texts.challengeLog, 1));
    if (!floor.theme.specialRule.includes('Masmorra mais simples')) {
      this.addLog(`${texts.specialRulePrefix} ${floor.theme.specialRule}`);
    }
    this.screen.set('dungeon');
    this.saveRun();
  }

  /**
   * Chance crescente de um companheiro aparecer por conta própria durante a
   * exploração — começa em 0% no 1º encontro do andar e sobe gradualmente até 25%
   * conforme a party avança pelas câmaras, parando de rolar assim que alguém
   * aparece (uma chance por masmorra). Chamado a cada encontro de combate real
   * (sala de monstro/chefe ou encontro aleatório).
   */
  private _maybeRecruitCompanion(): void {
    if (this.companionFoundThisFloor()) return;

    const floor = this.currentFloor();
    if (!floor) return;

    const encounterIndex = this.floorEncounterCount();
    this.floorEncounterCount.set(encounterIndex + 1);

    const totalChambers = Math.max(1, floor.totalRooms - 1);
    const chance = Math.min(0.25, (encounterIndex / totalChambers) * 0.25);
    if (Math.random() >= chance) return;

    const playerKits = this.character()?.kits ?? ['guerreiro'];
    const [pick] = this._generateCompanionChoices(playerKits);
    if (!pick) return;

    this.companionFoundThisFloor.set(true);
    const companion: Character = { ...pick, id: crypto.randomUUID(), isCompanion: true };
    this.companions.update(list => [...list, companion]);
    this.newCompanion.set(companion);
    this.addLog(`🤝 ${companion.name} aparece e se junta à aventura!`);
  }

  /** Gera 3 opções diversas de companheiros (excluindo o(s) kit(s) do jogador, variando entre si). */
  private _generateCompanionChoices(playerKits: string[]): Omit<Character, 'id'>[] {
    const playerKit = playerKits[0];
    const pool = PRESET_CHARACTERS.filter(c => c.kits[0] !== playerKit);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const seen = new Set<string>();
    const picks: Omit<Character, 'id'>[] = [];
    for (const c of shuffled) {
      const kit = c.kits[0];
      if (!seen.has(kit)) {
        seen.add(kit);
        picks.push({ ...c, isCompanion: true });
      }
      if (picks.length === 3) break;
    }
    for (const c of shuffled) {
      if (picks.length >= 3) break;
      if (!picks.find(p => p.kits[0] === c.kits[0])) {
        picks.push({ ...c, isCompanion: true });
      }
    }
    return picks.slice(0, 3);
  }

  // ── Andares ────────────────────────────────────────────────────────────────

  generateNewFloor(): void {
    // floorGrowthScale é computed() — já reflete a party atual automaticamente,
    // não precisa ser recalculado aqui (ver declaração do signal, no topo da classe).
    const floor = this.generator.generateFloor(this.floorNumber());
    this.currentFloor.set(floor);
    const entrance = floor.rooms.find(r => r.type === 'entrance')!;
    this.currentRoomId.set(entrance.id);
    this.floorEncounterCount.set(0);
    this.companionFoundThisFloor.set(false);
  }

  moveToRoom(roomId: number): void {
    const floor = this.currentFloor();
    if (!floor) return;

    const target = floor.rooms.find(r => r.id === roomId);
    if (!target || !target.isVisible) return;

    // Todas as salas são visíveis (pra planejar rota), mas só dá pra ANDAR pra uma sala
    // já visitada (cleared) ou diretamente conectada à atual (conexão normal ou secreta
    // já revelada) — visibilidade não é teleporte.
    const current = floor.rooms.find(r => r.isCurrent);
    const isAdjacent = !!current && (
      current.connections.includes(roomId)
      || (!!current.secretConnections?.includes(roomId) && !!target.isSecretRevealed)
    );
    if (!target.cleared && !target.isCurrent && !isAdjacent) return;

    if (target.requirement && !this.meetsRoomRequirement(target.requirement)) {
      this.addLog(`🔒 ${target.name} está trancada — requer ${target.requirement.label}.`);
      return;
    }

    // Câmaras não triviais não limpas abrem o dialog de cenário
    if (target.type !== 'entrance' && target.type !== 'empty' && !target.cleared) {
      this.pendingRoomEntry.set(roomId);
      return;
    }

    this._doMoveToRoom(roomId, target, floor);
  }

  confirmRoomEntry(choiceOrAction: RoomChoice | RoomChoiceAction): void {
    const choice = typeof choiceOrAction === 'string'
      ? { label: choiceOrAction, action: choiceOrAction }
      : choiceOrAction;
    const action = choice.action;
    const roomId = this.pendingRoomEntry();
    this.pendingRoomEntry.set(null);
    if (roomId === null) return;

    if (action === 'flee') return;

    const floor = this.currentFloor();
    const target = floor?.rooms.find(r => r.id === roomId);
    if (!target || !floor) return;

    this._applyStoryEffects(choice.effects ?? [], roomId);
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

    // Salas de tesouro, sociais e de enigma são marcadas como limpas ao entrar —
    // impede re-entrada duplicada e não dependem de derrotar ninguém.
    if (target.type === 'treasure' || target.type === 'social' || target.type === 'puzzle') {
      this._markRoomCleared(roomId);
    }

    this.enterCombatRoom(roomId, target.type);
  }

  /**
   * Configura o combate (busca o grupo de inimigos da sala) e troca pra tela de
   * encontro. Único ponto que decide isso — usado tanto pela primeira entrada
   * (confirmRoomEntry) quanto por qualquer retomada depois de fugir (ex.: botão
   * "Enfrentar o Encontro" no mapa). Nunca trocar pra 'encounter' direto sem
   * passar por aqui: pendingEnemies já é consumido (zerado) pela tela de combate
   * na primeira visita, então uma 2ª tentativa sem refazer esta busca cairia no
   * gerador genérico de fallback (fraco, sem relação com a masmorra real).
   */
  enterCombatRoom(roomId: number, type: DungeonRoom['type']): void {
    // Apenas salas de combate (monster/boss/hostage) buscam grupos de inimigos configurados.
    // Outros tipos (treasure/trap/social/puzzle/rest) nunca devem invocar combate,
    // mesmo que o mapa de roomEnemies tenha uma entrada com o mesmo id por acaso.
    if (type === 'monster' || type === 'boss' || type === 'hostage') {
      const config = this.campaign.getDungeonConfig(this.floorNumber());
      const roomGroup = config?.roomEnemies?.[roomId]?.(this.floorGrowthScale()) ?? null;
      this.pendingEnemies.set(roomGroup);
      // Salas 'hostage' já garantem um companheiro na vitória (_rescueHostage) — rolar a
      // chance aleatória aqui também daria 2 resgates na mesma sala em caso de acerto duplo.
      if (type !== 'hostage') this._maybeRecruitCompanion();
    } else {
      this.pendingEnemies.set(null);
    }
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
    const config = this.campaign.getDungeonConfig(this.floorNumber());
    const enemies = config?.rollEncounter?.(this.floorGrowthScale()) ?? null;
    if (!enemies) return false;
    this.addLog(`⚠️ Encontro aleatório! ${enemies.map(e => e.name).join(', ')} aparecem!`);
    this.pendingEnemies.set(enemies);
    this._maybeRecruitCompanion();
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
      const texts = this.campaign.activeCampaign().texts;
      this.addLog(texts.defeatLog);
      this.addLog(`${texts.floorReachedLabel} ${this.floorNumber()}/${this.TOTAL_FLOORS} — ${floor.theme.godName}`);
      this.clearSavedRun();
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
      } else if (room?.type === 'hostage') {
        this._rescueHostage();
      }
    }
    this.saveRun();
  }

  /** Derrotar os captores de uma sala 'hostage' liberta o refém — recrutado direto na party. */
  private _rescueHostage(): void {
    const playerKits = this.character()?.kits ?? ['guerreiro'];
    const [pick] = this._generateCompanionChoices(playerKits);
    if (!pick) return;

    const companion: Character = { ...pick, id: crypto.randomUUID(), isCompanion: true };
    this.companions.update(list => [...list, companion]);
    this.newCompanion.set(companion);
    this.addLog(`🎗️ ${companion.name} foi resgatado e se junta à aventura!`);
  }

  private _onBossDefeated(): void {
    const current = this.floorNumber();
    const next = current + 1;

    this.awardFloorCompletionPP();

    if (next > this.TOTAL_FLOORS) {
      this.screen.set('victory');
      this.addLog(this.campaign.activeCampaign().texts.victoryLog);
      this.clearSavedRun();
      return;
    }

    this.newCompanion.set(null);
    this.floorNumber.set(next);
    this.screen.set('floor_transition');
    this.saveRun();
  }

  proceedToNextFloor(): void {
    this.generateNewFloor();
    const theme = this.currentFloor()!.theme;
    const texts = this.campaign.activeCampaign().texts;
    this.addLog(this.campaign.floorText(texts.floorLog, this.floorNumber()));
    this.addLog(this.campaign.floorText(texts.challengeLog, this.floorNumber()));
    if (!theme.specialRule.includes('Masmorra mais simples')) {
      this.addLog(`${texts.specialRulePrefix} ${theme.specialRule}`);
    }
    this.screen.set('dungeon');
    this.saveRun();
  }

  private _applyStoryEffects(effects: StoryEffect[], roomId: number): void {
    for (const effect of effects) {
      switch (effect.type) {
        case 'set_flag':
          this.narrativeFlags.update(flags => ({ ...flags, [effect.flag]: effect.value }));
          break;
        case 'increment_flag':
          this.narrativeFlags.update(flags => {
            const current = Number(flags[effect.flag] ?? 0);
            return { ...flags, [effect.flag]: current + (effect.amount ?? 1) };
          });
          break;
        case 'add_log':
          this.addLog(effect.text);
          break;
        case 'grant_gold':
          this.character.update(c => c ? { ...c, gold: c.gold + effect.amount } : c);
          this.addLog(`+${effect.amount} ${this.campaign.activeCampaign().texts.currency}`);
          break;
        case 'grant_xp':
          this.character.update(c => c ? { ...c, xp: c.xp + effect.amount } : c);
          this.companions.update(list => list.map(c => ({ ...c, xp: c.xp + effect.amount })));
          this.addLog(`+${effect.amount} XP`);
          break;
        case 'clear_room':
          this._markRoomCleared(roomId);
          break;
      }
    }
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
   * Concede XP fixo a todos os membros da party de acordo com o RISCO REAL do combate
   * (mesma classificação trivial/equilibrado/arriscado/mortal da ferramenta de
   * balanceamento, mas calculada com os atributos reais da party e dos inimigos
   * enfrentados, não um "personagem médio" hipotético):
   *   trivial = 1 XP · equilibrado = 5 XP · arriscado = 8 XP · mortal = 20 XP (ver VERDICT_XP)
   * 10 XP acumulados = 1 PP (Ponto de Personagem) gastável em atributos/vantagens — regra real
   * do manual (3DeT Victory, p.127: "10XP valem 1 ponto de personagem").
   *
   * Terminar a masmorra concede 1 PP extra (awardFloorCompletionPP).
   */
  awardCombatXp(defeatedEnemies: Enemy[], goldAmount: number, isBossFight: boolean): CombatRewardSummary {
    const party = this.party();
    if (party.length === 0 || defeatedEnemies.length === 0) {
      return { xpPerCharacter: 0, isBossFight, verdict: 'trivial', goldAmount, reason: null };
    }

    const verdict: CombatVerdict = classifyCombatRisk({
      party: party.map(c => ({ poder: c.poder.current, resistencia: c.resistencia.current, hp: c.pontosVida.max })),
      enemies: defeatedEnemies.map(e => ({ poder: e.poder, resistencia: e.resistencia, hp: e.maxHp, armadura: e.armadura })),
    });
    const xp = VERDICT_XP[verdict];
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

    this.addLog(`✨ +${xp} XP por personagem (combate ${verdict})`);

    if (goldAmount > 0) {
      this.addLog(`💰 +${goldAmount} ${this.campaign.activeCampaign().texts.currency}`);
    }

    return { xpPerCharacter: xp, isBossFight, verdict, goldAmount, reason: null };
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
    this.addLog(`💰 +${goldAmount} ${this.campaign.activeCampaign().texts.currency}`);
  }

  /**
   * Custo para ir de N para N+1: 1PP por ponto até o 5º; acima de 5, o custo em PP
   * é igual ao próprio valor de destino (6º ponto custa 6PP, 7º custa 7PP, e assim
   * por diante) — recebe currentValue (valor ANTES do incremento) e calcula o custo
   * para alcançar currentValue+1.
   */
  private attrUpgradeCost(currentValue: number): number {
    const target = currentValue + 1;
    return target <= 5 ? 1 : target;
  }

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
      const pvMax = c.pontosVida.base  + (bonus.pontosVida ?? 0);
      const pmMax = c.pontosMana.base  + (bonus.pontosMana ?? 0);
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
      const pvMax = c.pontosVida.base  + (bonus.pontosVida ?? 0);
      const pmMax = c.pontosMana.base  + (bonus.pontosMana ?? 0);
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
    this.addLog(`🛒 Comprou ${item.icon} ${item.name} por ${price} ${this.campaign.activeCampaign().texts.currency}`);
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
    this.addLog(`💸 Vendeu ${item.icon} ${item.name} por ${sellPrice} ${this.campaign.activeCampaign().texts.currency}`);
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
    this.saveRun();
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
    this.newCompanion.set(null);
    this.currentFloor.set(null);
    this.narrativeFlags.set({});
    this.log.set([]);
  }

  saveRun(): void {
    const character = this.character();
    const currentFloor = this.currentFloor();
    if (!character || !currentFloor) return;
    if (!['dungeon', 'encounter', 'merchant', 'floor_transition'].includes(this.screen())) return;

    const data: SaveGameData = {
      version: 1,
      savedAt: new Date().toISOString(),
      campaignId: this.campaign.activeCampaignId(),
      adventureId: this.campaign.activeAdventureId(),
      screen: this.screen() as SaveGameData['screen'],
      character,
      companions: this.companions(),
      floorNumber: this.floorNumber(),
      currentFloor,
      currentRoomId: this.currentRoomId(),
      narrativeFlags: this.narrativeFlags(),
    };

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
      this.hasSavedRun.set(true);
    } catch {
      this.addLog('Não foi possível salvar a run atual.');
    }
  }

  loadSavedRun(): boolean {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw) as SaveGameData;
      if (data.version !== 1 || !data.character || !data.currentFloor) return false;

      this.campaign.setCampaign(data.campaignId, data.adventureId ?? undefined);
      this.character.set(data.character);
      this.companions.set(data.companions ?? []);
      this.floorNumber.set(data.floorNumber);
      this.currentFloor.set(data.currentFloor);
      this.currentRoomId.set(data.currentRoomId);
      this.narrativeFlags.set(data.narrativeFlags ?? {});
      this.newCompanion.set(null);
      this.pendingEnemies.set(null);
      this.pendingRoomEntry.set(null);
      this.screen.set(data.screen === 'encounter' ? 'dungeon' : data.screen);
      this.addLog(`Run carregada: ${this.campaign.activeCampaign().title}, andar ${data.floorNumber}.`);
      return true;
    } catch {
      this.clearSavedRun();
      return false;
    }
  }

  clearSavedRun(): void {
    try {
      localStorage.removeItem(SAVE_KEY);
    } finally {
      this.hasSavedRun.set(false);
    }
  }

  private _hasSavedRun(): boolean {
    try {
      return !!localStorage.getItem(SAVE_KEY);
    } catch {
      return false;
    }
  }
}
