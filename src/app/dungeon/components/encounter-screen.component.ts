import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { CombatService } from '../../core/services/combat.service';
import { CombatAbility } from '../../core/models/combat.model';

@Component({
  selector: 'app-encounter-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="encounter-screen">

      <!-- ── TOPO: info do andar ─────────────────────────────────── -->
      <div class="floor-bar">
        <span>{{ floor()?.theme?.icon }} Andar {{ floorNum() }}/20 — {{ floor()?.theme?.name }}</span>
        @if (room()?.type === 'boss') {
          <span class="boss-label">👑 CHEFÃO</span>
        }
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- COMBATE (monstro / boss)                                  -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (isCombat()) {
        <div class="battle-arena">

          <!-- Área do inimigo -->
          <div class="enemy-area" [class.enemy-hit]="enemyHitAnim()">
            <div class="enemy-sprite">{{ enemy()?.icon }}</div>
            <div class="enemy-info">
              <span class="enemy-name">{{ enemy()?.name }}</span>
              @if (enemy()?.isBoss) { <span class="boss-badge">CHEFÃO</span> }
              <div class="hp-bar-wrap">
                <div class="hp-bar-fill enemy-hp"
                     [style.width.%]="enemyHpPercent()">
                </div>
              </div>
              <span class="hp-text">{{ enemy()?.hp }} / {{ enemy()?.maxHp }} HP</span>
            </div>
          </div>

          <!-- Log de combate -->
          <div class="combat-log">
            @for (entry of combatLog(); track $index) {
              <div class="log-entry" [class]="'log-' + entry.type">
                {{ entry.text }}
              </div>
            }
          </div>

          <!-- Stats do jogador -->
          <div class="player-stats-bar" [class.player-hit]="playerHitAnim()">
            <div class="player-name-row">
              <span class="player-name">{{ char()?.name }}</span>
              <span class="player-class">{{ classIcon() }}</span>
            </div>
            <div class="bars-row">
              <div class="stat-bar-wrap">
                <span class="bar-label">HP</span>
                <div class="bar-track">
                  <div class="bar-fill pv-fill" [style.width.%]="pvPercent()" [class.pv-low]="pvPercent() < 30"></div>
                </div>
                <span class="bar-value">{{ char()?.pontosVida?.current }}/{{ char()?.pontosVida?.max }}</span>
              </div>
              @if (char()!.pontosMagia.max > 0) {
                <div class="stat-bar-wrap">
                  <span class="bar-label">PM</span>
                  <div class="bar-track">
                    <div class="bar-fill pm-fill" [style.width.%]="pmPercent()"></div>
                  </div>
                  <span class="bar-value">{{ char()?.pontosMagia?.current }}/{{ char()?.pontosMagia?.max }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Menu de ações -->
          <div class="action-menu" [class.disabled-menu]="phase() !== 'player_turn'">
            @if (!showMagicMenu()) {
              <div class="phase-indicator">
                @if (phase() === 'player_turn') { <span class="turn-player">▶ Seu Turno</span> }
                @if (phase() === 'enemy_turn') { <span class="turn-enemy">⚡ {{ enemy()?.name }} age...</span> }
                @if (phase() === 'victory') { <span class="turn-victory">🏆 Vitória!</span> }
                @if (phase() === 'defeat') { <span class="turn-defeat">💀 Derrota...</span> }
              </div>
              <div class="action-grid">
                <button class="action-btn btn-attack"
                        [disabled]="phase() !== 'player_turn'"
                        (click)="onAttack()">
                  <span class="btn-icon">⚔️</span>
                  <span class="btn-label">Atacar</span>
                </button>
                @if (hasAbilities()) {
                  <button class="action-btn btn-magic"
                          [disabled]="phase() !== 'player_turn'"
                          (click)="openMagicMenu()">
                    <span class="btn-icon">✨</span>
                    <span class="btn-label">Habilidade</span>
                  </button>
                }
                <button class="action-btn btn-item"
                        [disabled]="phase() !== 'player_turn' || !hasPotion()"
                        (click)="usePotion()">
                  <span class="btn-icon">🧪</span>
                  <span class="btn-label">Poção{{ hasPotion() ? '' : ' (0)' }}</span>
                </button>
                <button class="action-btn btn-flee"
                        [disabled]="phase() !== 'player_turn'"
                        (click)="onFlee()">
                  <span class="btn-icon">🏃</span>
                  <span class="btn-label">Fugir</span>
                </button>
              </div>
            }

            <!-- Sub-menu de habilidades -->
            @if (showMagicMenu()) {
              <div class="magic-menu">
                <button class="back-btn" (click)="closeMagicMenu()">← Voltar</button>
                <div class="ability-list">
                  @for (ab of abilities(); track ab.id) {
                    <button class="ability-btn"
                            [disabled]="!canUse(ab)"
                            (click)="onAbility(ab)">
                      <span class="ab-icon">{{ ab.icon }}</span>
                      <div class="ab-info">
                        <span class="ab-name">{{ ab.name }}</span>
                        <span class="ab-desc">{{ ab.description }}</span>
                      </div>
                      <span class="ab-cost">
                        @if (ab.pmCost > 0) { {{ ab.pmCost }} PM }
                        @if (ab.usesPerCombat) { 1×combate }
                      </span>
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ARMADILHA                                                 -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (room()?.type === 'trap') {
        <div class="simple-encounter trap-enc">
          <div class="enc-icon">⚠️</div>
          <h2>Armadilha!</h2>
          <p class="enc-desc">{{ room()?.description }}</p>
          <p class="roll-hint">Role 1d6 + H({{ char()?.habilidade?.current }}) ≥ {{ trapDiff() }} para escapar ileso.</p>
          @if (trapResult() === null) {
            <button class="btn-primary" (click)="rollTrap()">🎲 Testar Habilidade</button>
          } @else {
            <div class="roll-result" [class.success]="trapResult()! >= 0" [class.failure]="trapResult()! < 0">
              <span class="result-num">🎲 {{ trapTotal() }}</span>
              <span class="result-label">{{ trapResult()! >= 0 ? 'Escapou ileso!' : 'Atingido! −' + trapDmg() + ' PV' }}</span>
            </div>
            <button class="btn-victory" (click)="resolveTrap()">Continuar</button>
          }
        </div>
      }

      <!-- TESOURO -->
      @if (room()?.type === 'treasure') {
        <div class="simple-encounter treasure-enc">
          <div class="enc-icon">💰</div>
          <h2>Tesouro!</h2>
          <p class="enc-desc">{{ room()?.description }}</p>
          <p class="reward-text">Você encontrou: <strong>{{ treasureReward() }}</strong></p>
          <button class="btn-victory" (click)="victory()">✅ Pegar Tesouro</button>
        </div>
      }

      <!-- DESCANSO -->
      @if (room()?.type === 'rest') {
        <div class="simple-encounter rest-enc">
          <div class="enc-icon">🔥</div>
          <h2>Ponto de Descanso</h2>
          <p class="enc-desc">{{ room()?.description }}</p>
          <p class="reward-text">Recuperará <strong>{{ restAmount() }} PV</strong> e todos os PM.</p>
          <button class="btn-victory" (click)="rest()">💤 Descansar</button>
        </div>
      }

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .encounter-screen {
      display: flex; flex-direction: column; height: 100%;
      background: #0a0a0f; color: #e0d0b0;
      font-family: var(--font-body, monospace);
    }

    /* ── Topo ──────────────────────────────────────────────────── */
    .floor-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 0.4rem 0.75rem;
      background: rgba(0,0,0,0.6); border-bottom: 1px solid #2a2a3a;
      font-size: 0.75rem; color: #888;
    }
    .boss-label { color: #e74c3c; font-weight: bold; letter-spacing: 0.1em; }

    /* ── Arena de batalha ──────────────────────────────────────── */
    .battle-arena {
      display: flex; flex-direction: column; flex: 1; overflow: hidden;
    }

    /* Inimigo */
    .enemy-area {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.2rem;
      background: linear-gradient(180deg, #0d0d1a 0%, #111120 100%);
      border-bottom: 1px solid #1a1a2e;
      transition: background 0.15s;
      &.enemy-hit { background: linear-gradient(180deg, #2a0808 0%, #1a0a0a 100%); }
    }
    .enemy-sprite {
      font-size: 3.5rem; text-shadow: 0 0 20px rgba(255,100,50,0.4);
      min-width: 3.5rem; text-align: center;
    }
    .enemy-info { flex: 1; }
    .enemy-name {
      display: block; font-size: 1rem; font-weight: bold;
      color: #e0d0b0; font-family: var(--font-display, serif);
      margin-bottom: 0.2rem;
    }
    .boss-badge {
      display: inline-block; font-size: 0.65rem; padding: 0.1rem 0.4rem;
      background: #8b0000; color: #ffd; border-radius: 3px;
      margin-bottom: 0.3rem; letter-spacing: 0.1em;
    }
    .hp-bar-wrap {
      width: 100%; height: 10px; background: #1a1a1a;
      border-radius: 5px; overflow: hidden; margin: 0.3rem 0 0.2rem;
      border: 1px solid #333;
    }
    .hp-bar-fill {
      height: 100%; border-radius: 5px; transition: width 0.4s ease;
      &.enemy-hp { background: linear-gradient(90deg, #8b0000, #e74c3c); }
    }
    .hp-text { font-size: 0.72rem; color: #888; }

    /* Log de combate */
    .combat-log {
      flex: 1; overflow-y: auto; padding: 0.5rem 0.75rem;
      background: #07070d; border-bottom: 1px solid #1a1a2e;
      display: flex; flex-direction: column; gap: 0.25rem;
      min-height: 0;
    }
    .log-entry {
      font-size: 0.78rem; padding: 0.2rem 0.4rem;
      border-radius: 3px; line-height: 1.4; animation: fadeIn 0.3s ease;
      &.log-player { color: #7ec8e3; }
      &.log-enemy  { color: #e38989; }
      &.log-heal   { color: #7ee3a0; }
      &.log-system { color: #b8a06a; font-style: italic; }
      &.log-miss   { color: #666; }
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: none; } }

    /* Stats do jogador */
    .player-stats-bar {
      padding: 0.6rem 0.75rem;
      background: linear-gradient(180deg, #0e0e1c, #0b0b14);
      border-bottom: 1px solid #1a1a2e;
      transition: background 0.15s;
      &.player-hit { background: linear-gradient(180deg, #2a0808, #1a0505); }
    }
    .player-name-row {
      display: flex; justify-content: space-between; margin-bottom: 0.4rem;
    }
    .player-name { font-size: 0.85rem; color: #e0d0b0; font-family: var(--font-display, serif); }
    .player-class { font-size: 1rem; }
    .bars-row { display: flex; flex-direction: column; gap: 0.3rem; }
    .stat-bar-wrap {
      display: flex; align-items: center; gap: 0.4rem;
    }
    .bar-label { font-size: 0.65rem; color: #888; width: 1.8rem; }
    .bar-track {
      flex: 1; height: 8px; background: #1a1a1a;
      border-radius: 4px; overflow: hidden; border: 1px solid #2a2a3a;
    }
    .bar-fill {
      height: 100%; border-radius: 4px; transition: width 0.4s ease;
      &.pv-fill { background: linear-gradient(90deg, #1a6b1a, #27ae60); }
      &.pv-fill.pv-low { background: linear-gradient(90deg, #7a1a1a, #e74c3c); }
      &.pm-fill { background: linear-gradient(90deg, #1a1a6b, #8e44ad); }
    }
    .bar-value { font-size: 0.65rem; color: #888; width: 4rem; text-align: right; }

    /* Menu de ações */
    .action-menu {
      padding: 0.6rem 0.75rem;
      background: #0a0a12; border-top: 2px solid #1e1e30;
    }
    .disabled-menu { opacity: 0.85; }

    .phase-indicator {
      font-size: 0.72rem; margin-bottom: 0.5rem; text-align: center;
      height: 1.2rem;
    }
    .turn-player { color: #7ec8e3; }
    .turn-enemy  { color: #e38989; animation: blink 0.8s infinite alternate; }
    .turn-victory { color: #7ee3a0; font-weight: bold; }
    .turn-defeat  { color: #e38989; }
    @keyframes blink { from { opacity: 0.6; } to { opacity: 1; } }

    .action-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;
    }
    .action-btn {
      display: flex; flex-direction: column; align-items: center;
      padding: 0.5rem 0.3rem; border-radius: 6px; border: 1px solid;
      cursor: pointer; transition: all 0.15s ease; gap: 0.2rem;
      font-family: var(--font-display, serif);
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      &:not(:disabled):hover { filter: brightness(1.3); transform: translateY(-1px); }
      .btn-icon { font-size: 1.3rem; }
      .btn-label { font-size: 0.65rem; letter-spacing: 0.05em; }
      &.btn-attack {
        background: rgba(192,57,43,0.15); border-color: #c0392b; color: #e38989;
        &:not(:disabled):hover { background: rgba(192,57,43,0.3); }
      }
      &.btn-magic {
        background: rgba(142,68,173,0.15); border-color: #8e44ad; color: #c39bd3;
        &:not(:disabled):hover { background: rgba(142,68,173,0.3); }
      }
      &.btn-item {
        background: rgba(39,174,96,0.15); border-color: #27ae60; color: #7ee3a0;
        &:not(:disabled):hover { background: rgba(39,174,96,0.3); }
      }
      &.btn-flee {
        background: rgba(127,140,141,0.15); border-color: #7f8c8d; color: #bdc3c7;
        &:not(:disabled):hover { background: rgba(127,140,141,0.3); }
      }
    }

    /* Sub-menu de habilidades */
    .magic-menu { display: flex; flex-direction: column; gap: 0.4rem; }
    .back-btn {
      align-self: flex-start; background: none; border: 1px solid #333;
      color: #888; padding: 0.2rem 0.6rem; border-radius: 4px; cursor: pointer; font-size: 0.75rem;
      &:hover { color: #e0d0b0; border-color: #555; }
    }
    .ability-list { display: flex; flex-direction: column; gap: 0.3rem; }
    .ability-btn {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.4rem 0.6rem; background: rgba(142,68,173,0.1);
      border: 1px solid #4a2a6a; border-radius: 5px; cursor: pointer;
      text-align: left; width: 100%; transition: all 0.15s;
      &:disabled { opacity: 0.35; cursor: not-allowed; }
      &:not(:disabled):hover { background: rgba(142,68,173,0.25); border-color: #8e44ad; }
      .ab-icon { font-size: 1.2rem; min-width: 1.5rem; }
      .ab-info { flex: 1; display: flex; flex-direction: column; gap: 0.1rem; }
      .ab-name { font-size: 0.78rem; color: #c39bd3; font-family: var(--font-display, serif); }
      .ab-desc { font-size: 0.65rem; color: #888; }
      .ab-cost { font-size: 0.65rem; color: #8e44ad; white-space: nowrap; }
    }

    /* ── Encontros simples (armadilha / tesouro / descanso) ─────── */
    .simple-encounter {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 0.75rem; padding: 1.5rem;
      text-align: center;
    }
    .enc-icon { font-size: 3.5rem; }
    h2 { margin: 0; font-family: var(--font-display, serif); color: #d4aa20; font-size: 1.3rem; }
    .enc-desc { color: #888; font-size: 0.82rem; font-style: italic; max-width: 30ch; line-height: 1.5; }
    .roll-hint { color: #7ec8e3; font-size: 0.82rem; }
    .reward-text { color: #e0d0b0; font-size: 0.9rem;
      strong { color: #d4aa20; }
    }
    .roll-result {
      display: flex; gap: 0.75rem; align-items: center;
      padding: 0.6rem 1.2rem; border-radius: 6px; border: 1px solid;
      animation: fadeIn 0.3s ease;
      &.success { border-color: #27ae60; background: rgba(39,174,96,0.1); }
      &.failure  { border-color: #e74c3c; background: rgba(231,76,60,0.1); }
      .result-num   { font-size: 1.3rem; }
      .result-label { font-size: 0.9rem; color: #e0d0b0; }
    }
    .btn-primary, .btn-victory {
      padding: 0.6rem 1.6rem; border-radius: 5px; border: none;
      cursor: pointer; font-family: var(--font-display, serif);
      font-size: 0.85rem; letter-spacing: 0.05em; transition: all 0.2s;
    }
    .btn-primary { background: linear-gradient(135deg, #1a3a5c, #2980b9); color: #fff; border: 1px solid #3498db; }
    .btn-victory { background: linear-gradient(135deg, #1a4a1a, #27ae60); color: #fff; border: 1px solid #2ecc71; }
    .trap-enc { border-top: 3px solid #8e44ad; }
    .treasure-enc { border-top: 3px solid #d4aa20; }
    .rest-enc { border-top: 3px solid #e67e22; }
  `]
})
export class EncounterScreenComponent implements OnInit {
  private gs = inject(GameStateService);
  readonly combat = inject(CombatService);

  room = this.gs.currentRoom;
  char = this.gs.character;
  floor = this.gs.currentFloor;
  floorNum = this.gs.floorNumber;

  enemy = this.combat.enemy;
  phase = this.combat.phase;
  combatLog = this.combat.log;
  abilities = this.combat.abilities;

  showMagicMenu = signal(false);
  enemyHitAnim = signal(false);
  playerHitAnim = signal(false);

  trapTotal = signal<number | null>(null);
  trapResult = signal<number | null>(null);
  trapDmg = signal(0);
  treasureReward = signal('');
  restAmount = signal(0);

  isCombat = computed(() => {
    const t = this.room()?.type;
    return t === 'monster' || t === 'boss';
  });

  enemyHpPercent = computed(() => {
    const e = this.enemy();
    return e ? Math.max(0, (e.hp / e.maxHp) * 100) : 0;
  });

  pvPercent = computed(() => {
    const c = this.char();
    return c ? Math.max(0, (c.pontosVida.current / c.pontosVida.max) * 100) : 0;
  });

  pmPercent = computed(() => {
    const c = this.char();
    if (!c || c.pontosMagia.max === 0) return 0;
    return Math.max(0, (c.pontosMagia.current / c.pontosMagia.max) * 100);
  });

  trapDiff = computed(() => 3 + this.floorNum());

  hasAbilities = computed(() => this.abilities().length > 0);

  hasPotion = computed(() =>
    (this.char()?.items ?? []).includes('Poção de Cura')
  );

  classIcon = computed(() => {
    const icons: Record<string, string> = {
      guerreiro: '⚔️', mago: '🔮', ladino: '🗡️', clerigo: '🌟',
      ranger: '🏹', bardo: '🎵', druida: '🌿', paladino: '🛡️'
    };
    return icons[this.char()?.class ?? ''] ?? '👤';
  });

  ngOnInit(): void {
    if (this.isCombat()) {
      this.combat.initCombat(this.floorNum(), this.room()?.type === 'boss');
    }
    this.treasureReward.set(this.pickTreasure());
    this.restAmount.set(Math.floor(Math.random() * 5) + 3);
  }

  // ── Ações de combate ───────────────────────────────────────────

  onAttack(): void {
    const prevHp = this.enemy()?.hp ?? 0;
    const prevPv = this.char()?.pontosVida.current ?? 0;
    this.combat.playerAttack();
    this.flashEnemyHit(prevHp);
    this.flashPlayerHit(prevPv);
  }

  onAbility(ab: CombatAbility): void {
    const prevHp = this.enemy()?.hp ?? 0;
    const prevPv = this.char()?.pontosVida.current ?? 0;
    this.combat.playerUseAbility(ab);
    this.showMagicMenu.set(false);
    this.flashEnemyHit(prevHp);
    this.flashPlayerHit(prevPv);
  }

  onFlee(): void { this.combat.playerFlee(); }

  openMagicMenu(): void { this.showMagicMenu.set(true); }
  closeMagicMenu(): void { this.showMagicMenu.set(false); }

  canUse(ab: CombatAbility): boolean { return this.combat.canUseAbility(ab); }

  usePotion(): void {
    const c = this.char();
    if (!c) return;
    const heal = Math.floor(Math.random() * 6) + 4;
    const newPv = Math.min(c.pontosVida.max, c.pontosVida.current + heal);
    this.gs.character.update(ch => ch ? {
      ...ch,
      pontosVida: { ...ch.pontosVida, current: newPv },
      items: (() => { const idx = ch.items.indexOf('Poção de Cura'); const a = [...ch.items]; a.splice(idx, 1); return a; })()
    } : ch);
    this.gs.addLog(`🧪 Usou Poção de Cura (+${newPv - c.pontosVida.current} PV)`);
  }

  // ── Armadilha ─────────────────────────────────────────────────

  rollTrap(): void {
    const c = this.char();
    if (!c) return;
    const roll = Math.ceil(Math.random() * 6);
    const total = roll + c.habilidade.current;
    const diff = this.trapDiff();
    this.trapTotal.set(total);
    this.trapResult.set(total - diff);
    if (total < diff) {
      const dmg = Math.ceil(Math.random() * 6);
      this.trapDmg.set(dmg);
      this.gs.character.update(ch => ch ? {
        ...ch, pontosVida: { ...ch.pontosVida, current: Math.max(0, ch.pontosVida.current - dmg) }
      } : ch);
    }
    this.gs.addLog(`⚠️ Armadilha: ${roll}+H(${c.habilidade.current})=${total} vs ${diff}`);
  }

  resolveTrap(): void {
    if ((this.char()?.pontosVida.current ?? 1) <= 0) {
      this.gs.resolveEncounter('defeat');
    } else {
      this.gs.resolveEncounter('victory');
    }
  }

  // ── Tesouro / Descanso ────────────────────────────────────────

  victory(): void { this.gs.resolveEncounter('victory'); }

  rest(): void {
    const amt = this.restAmount();
    this.gs.character.update(c => c ? {
      ...c,
      pontosVida: { ...c.pontosVida, current: Math.min(c.pontosVida.max, c.pontosVida.current + amt) },
      pontosMagia: { ...c.pontosMagia, current: c.pontosMagia.max }
    } : c);
    this.gs.addLog(`🔥 Descansou: +${amt} PV, PM restaurados.`);
    this.gs.resolveEncounter('victory');
  }

  // ── Internos ──────────────────────────────────────────────────

  private flashEnemyHit(prevHp: number): void {
    if ((this.enemy()?.hp ?? prevHp) < prevHp) {
      this.enemyHitAnim.set(true);
      setTimeout(() => this.enemyHitAnim.set(false), 300);
    }
  }

  private flashPlayerHit(prevPv: number): void {
    setTimeout(() => {
      if ((this.char()?.pontosVida.current ?? prevPv) < prevPv) {
        this.playerHitAnim.set(true);
        setTimeout(() => this.playerHitAnim.set(false), 300);
      }
    }, 950);
  }

  private pickTreasure(): string {
    const items = ['Poção de Cura', 'Saco de Moedas (3d6 PO)', 'Pergaminho Mágico',
      'Amuleto Protetor', 'Arma +1', 'Armadura Reforçada', 'Gema Preciosa'];
    return items[Math.floor(Math.random() * items.length)];
  }
}
