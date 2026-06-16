import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { CombatService } from '../../../core/services/combat.service';
import { CombatAbility, Enemy } from '../../../core/models/combat.model';
import { Character } from '../../../core/models/character.model';
import { Item, rollTreasureItem } from '../../../core/models/item.model';

@Component({
  selector: 'app-encounter-screen',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="encounter-screen">

  <!-- ── Topo ──────────────────────────────────────────────────────── -->
  <div class="floor-bar">
    <span class="floor-info">{{ floor()?.theme?.icon }} Andar {{ floorNum() }}/20 — {{ floor()?.theme?.name }}</span>
    @if (isBossRoom()) { <span class="boss-label">👑 CHEFÃO</span> }
    <div class="phase-badge">
      @if (phase() === 'player_turn') { <span class="ph-player">▶ Seu Turno</span> }
      @if (phase() === 'enemy_turn')  { <span class="ph-enemy">⚡ Inimigos agem…</span> }
      @if (phase() === 'victory')     { <span class="ph-win">🏆 Vitória!</span> }
      @if (phase() === 'defeat')      { <span class="ph-loss">💀 Derrota…</span> }
    </div>
  </div>

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- COMBATE                                                         -->
  <!-- ═══════════════════════════════════════════════════════════════ -->
  @if (isCombat()) {
    <div class="battle-field">

      <!-- ── INIMIGOS (esquerda) ──────────────────────────────────── -->
      <div class="enemies-side">
        @for (e of enemies(); track e.id) {
          <div
            class="enemy-card"
            [class.is-targeted]="e.id === targetId()"
            [class.is-dead]="e.hp <= 0"
            [class.is-hit]="hitAnimId() === e.id"
            [class.is-viewed]="e.id === viewedEnemyId()"
            [class.clickable]="phase() === 'player_turn'"
            (click)="selectEnemy(e)">

            <div class="enemy-card-top">
              <div class="enemy-portrait" [class.boss-portrait]="e.isBoss">
                <span class="enemy-icon">{{ e.icon }}</span>
                @if (e.isBoss) { <span class="boss-crown">👑</span> }
              </div>

              <div class="enemy-card-info">
                <div class="enemy-name">
                  {{ e.name }}
                  @if (e.isBoss) { <span class="boss-pill">BOSS</span> }
                </div>

                <div class="hp-row">
                  <div class="hp-track">
                    <div class="hp-fill" [style.width.%]="hpPct(e)"
                      [class.hp-low]="hpPct(e) < 30"></div>
                  </div>
                  <span class="hp-num">{{ e.hp }}/{{ e.maxHp }}</span>
                </div>

                <div class="enemy-mini-stats">
                  <span title="Força">F{{ e.forca }}</span>
                  <span title="Habilidade">H{{ e.habilidade }}</span>
                  <span title="Armadura">A{{ e.armadura }}</span>
                  @if (e.id === targetId() && e.hp > 0) {
                    <span class="target-chip">▶ Alvo</span>
                  }
                </div>
              </div>
            </div>

            @if (e.hp <= 0) {
              <div class="dead-overlay">☠</div>
            }
          </div>
        }

        <!-- Painel de detalhes do inimigo selecionado -->
        @if (viewedEnemy() && viewedEnemy()!.hp > 0) {
          <div class="enemy-detail-panel">
            <div class="edp-header">
              <span class="edp-icon">{{ viewedEnemy()!.icon }}</span>
              <div>
                <div class="edp-name">{{ viewedEnemy()!.name }}</div>
                <div class="edp-flavor">{{ viewedEnemy()!.flavorText }}</div>
              </div>
            </div>
            <div class="edp-stats">
              <div class="edp-stat"><span class="edp-stat-label">Força</span><span class="edp-stat-val">{{ viewedEnemy()!.forca }}</span></div>
              <div class="edp-stat"><span class="edp-stat-label">Habilidade</span><span class="edp-stat-val">{{ viewedEnemy()!.habilidade }}</span></div>
              <div class="edp-stat"><span class="edp-stat-label">Armadura</span><span class="edp-stat-val">{{ viewedEnemy()!.armadura }}</span></div>
              <div class="edp-stat"><span class="edp-stat-label">Recomp.</span><span class="edp-stat-val">{{ viewedEnemy()!.xpReward }}xp / {{ viewedEnemy()!.goldReward }}🪙</span></div>
            </div>
            <div class="edp-attacks">
              <span class="edp-atk-label">Ataque:</span>
              <span class="edp-atk-desc">Físico — {{ viewedEnemy()!.forca }} + 1d6 − Arm({{ viewedEnemy()!.armadura }})</span>
            </div>
          </div>
        }
      </div>

      <!-- ── PARTY (direita) ─────────────────────────────────────── -->
      <div class="battle-divider" aria-hidden="true"></div>

      <div class="party-side">
        @for (member of party(); track member.id) {
          <div class="party-member"
            [class.member-hit]="hitMemberId() === member.id"
            [class.member-dead]="member.pontosVida.current <= 0">

            <div class="member-portrait" [style.border-color]="classColor(member)">
              <span>{{ member.portraitIcon ?? classIcon(member) }}</span>
            </div>

            <div class="member-info">
              <div class="member-name">{{ member.name.split(',')[0] }}</div>
              <div class="member-class">{{ member.class | titlecase }}</div>

              <div class="member-bars">
                <div class="bar-row">
                  <span class="bar-lbl">HP</span>
                  <div class="bar-track">
                    <div class="bar-fill hp-fill-green"
                      [style.width.%]="pvPct(member)"
                      [class.hp-low]="pvPct(member) < 30"></div>
                  </div>
                  <span class="bar-val">{{ member.pontosVida.current }}/{{ member.pontosVida.max }}</span>
                </div>
                @if (member.pontosMana.max > 0) {
                  <div class="bar-row">
                    <span class="bar-lbl">PM</span>
                    <div class="bar-track">
                      <div class="bar-fill pm-fill"
                        [style.width.%]="pmPct(member)"></div>
                    </div>
                    <span class="bar-val">{{ member.pontosMana.current }}/{{ member.pontosMana.max }}</span>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- ── Barra de ações ─────────────────────────────────────────── -->
    <div class="action-bar" [class.disabled-bar]="phase() !== 'player_turn'">
      @if (!showMagicMenu() && !showAttackMenu()) {
        <div class="action-btns">
          <button class="act-btn atk" [disabled]="phase() !== 'player_turn'" (click)="showAttackMenu.set(true)">
            <span class="act-icon">⚔️</span><span class="act-lbl">Atacar</span>
          </button>
          @if (hasAbilities()) {
            <button class="act-btn mgc" [disabled]="phase() !== 'player_turn'" (click)="showMagicMenu.set(true)">
              <span class="act-icon">✨</span><span class="act-lbl">Habilidade</span>
            </button>
          }
          <button class="act-btn itm" [disabled]="phase() !== 'player_turn' || !hasPotion()" (click)="showInventory.set(true)">
            <span class="act-icon">🎒</span><span class="act-lbl">Itens{{ consumables().length ? ' (' + consumables().length + ')' : '' }}</span>
          </button>
          @if (!hasBoss()) {
            <button class="act-btn fle" [disabled]="phase() !== 'player_turn'" (click)="onFlee()">
              <span class="act-icon">🏃</span><span class="act-lbl">Fugir</span>
            </button>
          }
        </div>
      } @else if (showAttackMenu()) {
        <!-- Sub-menu de tipo de ataque -->
        <div class="magic-menu">
          <button class="back-btn" (click)="showAttackMenu.set(false)">← Voltar</button>
          <div class="ability-list">
            <button class="ab-btn" (click)="onAttackMelee()">
              <span class="ab-icon">⚔️</span>
              <span class="ab-name">Corpo a Corpo</span>
              <span class="ab-cost">F+H+1d6</span>
            </button>
            <button class="ab-btn" (click)="onAttackRanged()">
              <span class="ab-icon">🏹</span>
              <span class="ab-name">À Distância</span>
              <span class="ab-cost">PF+H+1d6</span>
            </button>
          </div>
        </div>
      } @else if (showInventory()) {
        <!-- Sub-menu de itens -->
        <div class="magic-menu">
          <button class="back-btn" (click)="showInventory.set(false)">← Voltar</button>
          <div class="ability-list">
            @for (item of consumables(); track item.id) {
              <button class="ab-btn" (click)="useItem(item)">
                <span class="ab-icon">{{ item.icon }}</span>
                <span class="ab-name">{{ item.name }}</span>
                <span class="ab-cost ab-rarity-{{ item.rarity }}">{{ item.rarity === 'rare' ? 'Raro' : item.rarity === 'uncommon' ? 'Incomum' : 'Comum' }}</span>
                <span class="ab-desc">{{ item.description }}</span>
              </button>
            }
            @if (consumables().length === 0) {
              <p style="color:#555;font-size:12px;text-align:center;padding:12px">Nenhum consumível disponível.</p>
            }
          </div>
        </div>
      } @else {
        <!-- Sub-menu de habilidades -->
        <div class="magic-menu">
          <button class="back-btn" (click)="showMagicMenu.set(false)">← Voltar</button>
          <div class="ability-list">
            @for (ab of abilities(); track ab.id) {
              <button class="ab-btn" [disabled]="!canUse(ab)" (click)="onAbility(ab)">
                <span class="ab-icon">{{ ab.icon }}</span>
                <span class="ab-name">{{ ab.name }}</span>
                <span class="ab-cost">
                  @if (ab.pmCost > 0) { {{ ab.pmCost }}PM }
                  @else if (ab.usesPerCombat) { 1×comb }
                </span>
                <span class="ab-desc">{{ ab.description }}</span>
              </button>
            }
          </div>
        </div>
      }
    </div>
  }

  <!-- ═══════════════════════════════════════════════════════════════ -->
  <!-- ENCONTROS SIMPLES                                               -->
  <!-- ═══════════════════════════════════════════════════════════════ -->

  @if (room()?.type === 'trap') {
    <div class="simple-encounter trap-enc">
      <div class="enc-icon">⚠️</div>
      <h2>Armadilha!</h2>
      <p class="enc-desc">{{ room()?.description }}</p>
      <p class="roll-hint">Role 1d6 + H({{ char()?.habilidade?.current }}) ≥ {{ trapDiff() }} para escapar.</p>
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

  @if (room()?.type === 'treasure') {
    <div class="simple-encounter treasure-enc">
      <div class="enc-icon">💰</div>
      <h2>Tesouro!</h2>
      <p class="enc-desc">{{ room()?.description }}</p>
      @if (treasureItem(); as ti) {
        <div class="treasure-item-card">
          <span class="treasure-item-icon">{{ ti.icon }}</span>
          <div class="treasure-item-info">
            <span class="treasure-item-name">{{ ti.name }}</span>
            <span class="treasure-item-rarity ab-rarity-{{ ti.rarity }}">{{ ti.rarity === 'rare' ? '✨ Raro' : ti.rarity === 'uncommon' ? '◆ Incomum' : '● Comum' }}</span>
            <span class="treasure-item-desc">{{ ti.description }}</span>
            @if (ti.statBonus) {
              <span class="treasure-item-bonus">
                @if (ti.statBonus.forca)       { +{{ ti.statBonus.forca }}F }
                @if (ti.statBonus.habilidade)  { +{{ ti.statBonus.habilidade }}H }
                @if (ti.statBonus.resistencia) { +{{ ti.statBonus.resistencia }}R }
                @if (ti.statBonus.armadura)    { +{{ ti.statBonus.armadura }}A }
                @if (ti.statBonus.poderFogo)   { +{{ ti.statBonus.poderFogo }}PF }
                @if (ti.statBonus.pontosVida)  { +{{ ti.statBonus.pontosVida }}PV }
                @if (ti.statBonus.pontosMana)  { +{{ ti.statBonus.pontosMana }}PM }
              </span>
            }
          </div>
        </div>
      }
      <button class="btn-victory" (click)="victory()">✅ Pegar {{ treasureReward() }}</button>
    </div>
  }

  @if (room()?.type === 'rest') {
    <div class="simple-encounter rest-enc">
      <div class="enc-icon">🔥</div>
      <h2>Ponto de Descanso</h2>
      <p class="enc-desc">{{ room()?.description }}</p>
      <p class="reward-text">Recuperará <strong>{{ restAmount() }} PV</strong> e todos os PF.</p>
      <button class="btn-victory" (click)="rest()">💤 Descansar</button>
    </div>
  }

</div>

<!-- ── Overlay de Derrota ──────────────────────────────────────────────── -->
@if (combat.pendingDefeat()) {
  <div class="defeat-overlay">
    <div class="defeat-panel">
      <div class="defeat-icon">💀</div>
      <h2 class="defeat-title">Você Caiu</h2>
      <p class="defeat-sub">As sombras de Valkaria reclamaram mais uma alma...</p>

      <div class="defeat-log">
        @for (entry of combat.log(); track $index) {
          <div class="dl-entry" [class]="'dl-' + entry.type" [innerHTML]="entry.text"></div>
        }
      </div>

      <button class="btn-defeat-proceed" (click)="combat.confirmDefeat()">
        Prosseguir →
      </button>
    </div>
  </div>
}
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }

    /* ── Tela principal ─────────────────────────────────────────── */
    .encounter-screen {
      display: grid;
      grid-template-rows: auto 1fr auto;
      height: 100%;
      background: #07070f;
      color: #e0d0b0;
      font-family: var(--font-body, monospace);
      overflow: hidden;
    }

    /* ── Topo ───────────────────────────────────────────────────── */
    .floor-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.35rem 0.75rem;
      background: rgba(0,0,0,0.6); border-bottom: 1px solid #1a1a30;
      font-size: 0.72rem; color: #888; flex-shrink: 0;
      gap: 0.5rem;
    }
    .floor-info { flex: 1; }
    .boss-label { color: #e74c3c; font-weight: bold; letter-spacing: 0.1em; font-size: 0.7rem; }
    .phase-badge { font-size: 0.75rem; font-weight: bold; }
    .ph-player { color: #7ec8e3; }
    .ph-enemy  { color: #e38989; animation: blink 0.7s infinite alternate; }
    .ph-win    { color: #7ee3a0; }
    .ph-loss   { color: #e38989; }
    @keyframes blink { from { opacity: 0.5; } to { opacity: 1; } }

    /* ── Campo de batalha ───────────────────────────────────────── */
    .battle-field {
      display: grid;
      grid-template-columns: 1fr 1px 1fr;
      min-height: 0;
      overflow: hidden;
    }

    /* ── Inimigos (esquerda) ────────────────────────────────────── */
    .enemies-side {
      display: flex; flex-direction: column;
      gap: 0.4rem; padding: 0.6rem 0.6rem;
      background: linear-gradient(135deg, #0b0b18, #0f0f20);
      overflow-y: auto;
    }

    /* ── Card de inimigo (espelho do party-card) ─────────────────── */
    .enemy-card {
      display: flex; flex-direction: column; gap: 0;
      border-radius: 7px; border: 1px solid #1a1a2e;
      background: rgba(255,255,255,0.02);
      position: relative; transition: all 0.15s;
      cursor: default; overflow: hidden;

      &.clickable { cursor: pointer; }
      &.clickable:hover { background: rgba(231,76,60,0.08); border-color: #5a2020; }
      &.is-targeted {
        background: rgba(231,76,60,0.14);
        border-color: #c0392b;
        box-shadow: 0 0 10px rgba(192,57,43,0.3);
      }
      &.is-viewed {
        border-color: #e74c3c;
        box-shadow: 0 0 14px rgba(231,76,60,0.35);
      }
      &.is-dead { opacity: 0.32; filter: grayscale(1); pointer-events: none; }
      &.is-hit { animation: shake 0.3s ease; background: rgba(200,0,0,0.35) !important; }
    }
    .enemy-card-top {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.4rem 0.5rem;
    }
    .enemy-portrait {
      width: 42px; height: 42px; flex-shrink: 0;
      border-radius: 50%; border: 2px solid #3a1a1a;
      background: rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.5rem; position: relative;
      &.boss-portrait { border-color: #8b0000; box-shadow: 0 0 8px rgba(139,0,0,0.5); }
    }
    .boss-crown {
      position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
      font-size: 0.75rem; line-height: 1;
    }
    .enemy-icon { line-height: 1; }
    .enemy-card-info { flex: 1; min-width: 0; }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25%       { transform: translateX(-5px); }
      75%       { transform: translateX(5px); }
    }

    .enemy-name {
      font-size: 0.8rem; font-weight: bold; color: #e0d0b0;
      display: flex; align-items: center; gap: 0.3rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .boss-pill {
      font-size: 0.55rem; padding: 1px 5px; background: #8b0000;
      color: #ffd; border-radius: 3px; flex-shrink: 0;
    }

    .hp-row { display: flex; align-items: center; gap: 0.4rem; margin-top: 0.2rem; }
    .hp-track {
      flex: 1; height: 5px; background: #1a1a1a;
      border-radius: 3px; overflow: hidden; border: 1px solid #333;
    }
    .hp-fill {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, #8b0000, #e74c3c);
      transition: width 0.4s ease;
      &.hp-low { background: linear-gradient(90deg, #600, #e74c3c); animation: pulse-red 0.8s infinite alternate; }
    }
    @keyframes pulse-red { from { opacity: 0.7; } to { opacity: 1; } }
    .hp-num { font-size: 0.6rem; color: #888; white-space: nowrap; }

    .enemy-mini-stats {
      display: flex; align-items: center; gap: 0.3rem;
      margin-top: 0.2rem; flex-wrap: wrap;
      span { font-size: 0.6rem; color: #886; }
    }
    .target-chip {
      color: #e74c3c !important; font-weight: bold; font-size: 0.58rem;
      background: rgba(231,76,60,0.15); border-radius: 3px;
      padding: 1px 4px; margin-left: auto;
    }

    .dead-overlay {
      position: absolute; inset: 0; display: flex; align-items: center;
      justify-content: center; font-size: 1.6rem; pointer-events: none;
    }

    /* ── Painel de detalhes do inimigo ──────────────────────────── */
    .enemy-detail-panel {
      margin-top: 0.1rem;
      padding: 0.55rem 0.6rem;
      background: rgba(20,5,5,0.9);
      border: 1px solid #3a1a1a;
      border-radius: 6px;
      animation: fadeSlide 0.18s ease;
    }
    .edp-header {
      display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.4rem;
    }
    .edp-icon { font-size: 1.8rem; flex-shrink: 0; line-height: 1; }
    .edp-name { font-size: 0.8rem; font-weight: bold; color: #e0d0b0; }
    .edp-flavor { font-size: 0.65rem; color: #776; font-style: italic; margin-top: 0.15rem; line-height: 1.35; }
    .edp-stats {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 0.2rem 0.5rem; margin-bottom: 0.4rem;
    }
    .edp-stat { display: flex; justify-content: space-between; font-size: 0.65rem; }
    .edp-stat-label { color: #666; }
    .edp-stat-val   { color: #c39; font-weight: bold; }
    .edp-attacks {
      display: flex; gap: 0.35rem; align-items: baseline;
      font-size: 0.62rem; border-top: 1px solid #2a1a1a; padding-top: 0.3rem;
    }
    .edp-atk-label { color: #e38989; font-weight: bold; flex-shrink: 0; }
    .edp-atk-desc  { color: #886; }

    /* ── Divisor ────────────────────────────────────────────────── */
    .battle-divider {
      background: linear-gradient(to bottom, transparent, #2a2a3a 30%, #2a2a3a 70%, transparent);
      width: 1px; align-self: stretch; margin: 0.5rem 0;
    }

    /* ── Party (direita) ────────────────────────────────────────── */
    .party-side {
      display: flex; flex-direction: column; justify-content: center;
      gap: 0.5rem; padding: 0.75rem 0.75rem;
      background: linear-gradient(135deg, #0f0f20, #0b0b18);
      overflow-y: auto;
    }

    .party-member {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.4rem 0.5rem; border-radius: 6px;
      border: 1px solid #1a1a2e; background: rgba(255,255,255,0.02);
      transition: background 0.15s;
      &.member-hit { animation: flash-hit 0.4s ease; }
      &.member-dead { opacity: 0.4; filter: grayscale(1); }
    }
    @keyframes flash-hit {
      0%, 100% { background: rgba(255,255,255,0.02); }
      40%       { background: rgba(200,0,0,0.35); }
    }

    .member-portrait {
      width: 42px; height: 42px; flex-shrink: 0;
      border-radius: 50%; border: 2px solid #333;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.4rem;
    }

    .member-info { flex: 1; min-width: 0; }
    .member-name {
      font-size: 0.82rem; font-weight: bold; color: #e0d0b0;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .member-class { font-size: 0.62rem; color: #666; margin-bottom: 0.25rem; }

    .member-bars { display: flex; flex-direction: column; gap: 0.2rem; }
    .bar-row { display: flex; align-items: center; gap: 0.35rem; }
    .bar-lbl { font-size: 0.6rem; color: #666; width: 1.5rem; flex-shrink: 0; }
    .bar-track {
      flex: 1; height: 6px; background: #111;
      border-radius: 3px; overflow: hidden; border: 1px solid #222;
    }
    .bar-fill {
      height: 100%; border-radius: 3px; transition: width 0.4s;
      &.hp-fill-green { background: linear-gradient(90deg, #1a5c1a, #27ae60); }
      &.hp-low        { background: linear-gradient(90deg, #7a1a1a, #e74c3c) !important; animation: pulse-red 0.8s infinite alternate; }
      &.pf-fill,
      &.pm-fill       { background: linear-gradient(90deg, #2a1a6b, #8e44ad); }
    }
    .bar-val { font-size: 0.6rem; color: #888; white-space: nowrap; min-width: 3.2rem; text-align: right; }

    /* ── Log de combate ─────────────────────────────────────────── */
    .combat-log {
      display: flex; flex-direction: column; gap: 2px;
      padding: 0.35rem 0.6rem;
      background: #04040c;
      border-top: 1px solid #12122a;
      border-bottom: 1px solid #12122a;
      max-height: 5.5rem; overflow-y: auto;
      scrollbar-width: thin; scrollbar-color: #1a1a2e transparent;
      flex-shrink: 0;
    }
    .log-line {
      font-size: 0.72rem; padding: 1px 0; line-height: 1.4;
      animation: fadeSlide 0.25s ease;
      &.ll-player { color: #7ec8e3; }
      &.ll-enemy  { color: #e38989; }
      &.ll-heal   { color: #7ee3a0; }
      &.ll-system { color: #b8a06a; font-style: italic; }
      &.ll-miss   { color: #484848; }
    }
    @keyframes fadeSlide { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

    /* ── Barra de ações ─────────────────────────────────────────── */
    .action-bar {
      padding: 0.5rem 0.6rem;
      background: #090912;
      border-top: 2px solid #1a1a30;
      flex-shrink: 0;
    }
    .disabled-bar { opacity: 0.75; pointer-events: none; }

    .action-btns {
      display: flex; gap: 0.4rem; flex-wrap: wrap;
    }

    .act-btn {
      flex: 1; min-width: 0;
      display: flex; flex-direction: column; align-items: center;
      padding: 0.45rem 0.3rem; border-radius: 6px;
      border: 1px solid; cursor: pointer; gap: 0.15rem;
      font-family: var(--font-display, serif);
      transition: all 0.15s;
      &:disabled { opacity: 0.35; cursor: not-allowed; }
      &:not(:disabled):hover { filter: brightness(1.35); transform: translateY(-2px); }
      .act-icon { font-size: 1.4rem; line-height: 1; }
      .act-lbl  { font-size: 0.6rem; letter-spacing: 0.04em; }

      &.atk { background: rgba(192,57,43,0.15); border-color: #c0392b; color: #e38989; }
      &.mgc { background: rgba(142,68,173,0.15); border-color: #8e44ad; color: #c39bd3; }
      &.itm { background: rgba(39,174,96,0.15);  border-color: #27ae60; color: #7ee3a0; }
      &.fle { background: rgba(127,140,141,0.15);border-color: #7f8c8d; color: #bdc3c7; }
    }

    /* ── Sub-menu de habilidades ────────────────────────────────── */
    .magic-menu {
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .back-btn {
      align-self: flex-start; background: none; border: 1px solid #2a2a3a;
      color: #666; padding: 0.15rem 0.5rem; border-radius: 4px;
      cursor: pointer; font-size: 0.72rem;
      &:hover { color: #e0d0b0; border-color: #444; }
    }
    .ability-list {
      display: flex; gap: 0.3rem; flex-wrap: wrap;
    }
    .ab-btn {
      display: flex; flex-direction: column; align-items: center;
      flex: 1; min-width: 80px;
      padding: 0.35rem 0.4rem; border-radius: 5px;
      background: rgba(142,68,173,0.1); border: 1px solid #3a1a5a;
      cursor: pointer; color: #c39bd3;
      transition: all 0.15s; gap: 0.1rem;
      &:disabled { opacity: 0.3; cursor: not-allowed; }
      &:not(:disabled):hover { background: rgba(142,68,173,0.25); border-color: #8e44ad; }
      .ab-icon { font-size: 1.2rem; }
      .ab-name { font-size: 0.68rem; font-weight: bold; text-align: center; }
      .ab-cost { font-size: 0.6rem; color: #8e44ad; }
      .ab-desc { font-size: 0.55rem; color: #666; text-align: center; line-height: 1.3; display: none; }
    }

    /* ── Encontros simples ──────────────────────────────────────── */
    .simple-encounter {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 0.75rem; padding: 1.5rem; text-align: center;
    }
    .enc-icon { font-size: 3.5rem; }
    h2 { margin: 0; font-family: var(--font-display, serif); color: #d4aa20; font-size: 1.3rem; }
    .enc-desc { color: #888; font-size: 0.82rem; font-style: italic; max-width: 30ch; line-height: 1.5; }
    .roll-hint { color: #7ec8e3; font-size: 0.82rem; }
    .reward-text { color: #e0d0b0; font-size: 0.9rem; strong { color: #d4aa20; } }
    .roll-result {
      display: flex; gap: 0.75rem; align-items: center;
      padding: 0.6rem 1.2rem; border-radius: 6px; border: 1px solid;
      &.success { border-color: #27ae60; background: rgba(39,174,96,0.1); }
      &.failure  { border-color: #e74c3c; background: rgba(231,76,60,0.1); }
      .result-num   { font-size: 1.3rem; }
      .result-label { font-size: 0.9rem; }
    }
    .btn-primary, .btn-victory {
      padding: 0.6rem 1.6rem; border-radius: 5px; border: none;
      cursor: pointer; font-family: var(--font-display, serif);
      font-size: 0.85rem; letter-spacing: 0.05em;
    }
    .btn-primary { background: linear-gradient(135deg, #1a3a5c, #2980b9); color: #fff; border: 1px solid #3498db; }
    .btn-victory { background: linear-gradient(135deg, #1a4a1a, #27ae60); color: #fff; border: 1px solid #2ecc71; }

    /* ── Item card no tesouro ──────────────────────────────────────────── */
    .treasure-item-card {
      display: flex; align-items: flex-start; gap: 0.75rem;
      background: rgba(255,215,0,0.08); border: 1px solid #ca8a04;
      border-radius: 8px; padding: 0.7rem 0.9rem; margin: 0.6rem 0; text-align: left;
    }
    .treasure-item-icon { font-size: 2rem; line-height: 1; }
    .treasure-item-info { display: flex; flex-direction: column; gap: 0.2rem; }
    .treasure-item-name { font-weight: bold; font-size: 0.95rem; color: #fde68a; }
    .treasure-item-rarity { font-size: 0.72rem; font-weight: bold; }
    .treasure-item-desc { font-size: 0.78rem; color: #9ca3af; }
    .treasure-item-bonus { font-size: 0.8rem; color: #86efac; font-weight: bold; }
    .ab-rarity-common   { color: #9ca3af; }
    .ab-rarity-uncommon { color: #60a5fa; }
    .ab-rarity-rare     { color: #c084fc; }

    /* ── Overlay de derrota ─────────────────────────────────────────── */
    .defeat-overlay {
      position: fixed; inset: 0; z-index: 100;
      background: rgba(0,0,0,0.82);
      display: flex; align-items: center; justify-content: center;
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .defeat-panel {
      background: #0d0d1a; border: 1px solid #3a0000;
      border-radius: 10px; padding: 1.5rem 1.75rem;
      display: flex; flex-direction: column; align-items: center;
      gap: 0.75rem; max-width: 420px; width: 90%;
      box-shadow: 0 0 40px rgba(180,0,0,0.3);
    }
    .defeat-icon { font-size: 2.8rem; }
    .defeat-title { margin: 0; font-family: var(--font-display, serif); color: #c0392b; font-size: 1.4rem; }
    .defeat-sub { margin: 0; color: #888; font-size: 0.8rem; text-align: center; }
    .defeat-log {
      width: 100%; max-height: 200px; overflow-y: auto;
      background: #07070f; border: 1px solid #1a1a2a;
      border-radius: 6px; padding: 0.5rem 0.6rem;
      display: flex; flex-direction: column; gap: 0.2rem;
    }
    .dl-entry { font-size: 0.68rem; line-height: 1.4; color: #a0a0b0; }
    .dl-player { color: #7ec8e3; }
    .dl-enemy  { color: #e38989; }
    .dl-heal   { color: #7ee3a0; }
    .dl-miss   { color: #666; font-style: italic; }
    .dl-system { color: #d4aa20; }
    .btn-defeat-proceed {
      margin-top: 0.25rem; padding: 0.55rem 1.8rem;
      background: linear-gradient(135deg, #3a0000, #c0392b);
      color: #fff; border: 1px solid #e74c3c;
      border-radius: 5px; cursor: pointer;
      font-family: var(--font-display, serif); font-size: 0.9rem;
      letter-spacing: 0.05em;
      &:hover { filter: brightness(1.2); }
    }
  `]
})
export class EncounterScreenComponent implements OnInit {
  private gs = inject(GameStateService);
  readonly combat = inject(CombatService);

  room      = this.gs.currentRoom;
  char      = this.gs.character;
  party     = this.gs.party;
  floor     = this.gs.currentFloor;
  floorNum  = this.gs.floorNumber;

  enemies   = this.combat.enemies;
  phase     = this.combat.phase;
  combatLog = this.combat.log;
  abilities = this.combat.abilities;

  showMagicMenu    = signal(false);
  showAttackMenu   = signal(false);
  isRandomEncounter = signal(false);
  hitAnimId        = signal<string | null>(null);
  hitMemberId      = signal<string | null>(null);

  // ── Alvo e card visualizado ───────────────────────────────────────
  targetId     = signal<string | null>(null);
  viewedEnemyId = signal<string | null>(null);

  viewedEnemy = computed<Enemy | null>(() => {
    const id = this.viewedEnemyId();
    return id ? (this.enemies().find(e => e.id === id) ?? null) : null;
  });

  /** Inimigo efetivamente alvo: selecionado (se vivo) ou primeiro vivo */
  target = computed<Enemy | null>(() => {
    const list = this.enemies();
    const tid = this.targetId();
    if (tid) {
      const sel = list.find(e => e.id === tid && e.hp > 0);
      if (sel) return sel;
    }
    return list.find(e => e.hp > 0) ?? null;
  });

  trapTotal  = signal<number | null>(null);
  trapResult = signal<number | null>(null);
  trapDmg    = signal(0);
  treasureItem   = signal<Item | null>(null);
  treasureReward = signal('');
  restAmount = signal(0);
  showInventory  = signal(false);

  isCombat = computed(() => {
    const t = this.room()?.type;
    return t === 'monster' || t === 'boss' || this.isRandomEncounter();
  });

  isBossRoom = computed(() => this.room()?.type === 'boss' || this.enemies().some(e => e.isBoss));
  hasBoss    = computed(() => this.enemies().some(e => e.isBoss));
  hasAbilities = computed(() => this.abilities().length > 0);
  consumables  = computed(() => (this.char()?.inventory ?? []).filter(i => i.category === 'consumable' && i.usableInCombat));
  hasPotion    = computed(() => this.consumables().length > 0);
  trapDiff     = computed(() => 3 + this.floorNum());

  ngOnInit(): void {
    const pending  = this.gs.pendingEnemies();
    const isBoss   = this.room()?.type === 'boss';
    const roomComb = this.room()?.type === 'monster' || isBoss;

    if (pending) {
      this.isRandomEncounter.set(!roomComb);
      this.combat.initCombat(this.floorNum(), isBoss, pending);
      this.gs.pendingEnemies.set(null);
    } else if (roomComb) {
      this.combat.initCombat(this.floorNum(), isBoss);
    }

    // Auto-seleciona primeiro inimigo vivo
    const firstAlive = this.enemies().find(e => e.hp > 0);
    if (firstAlive) this.targetId.set(firstAlive.id);

    const ti = this.pickTreasureItem();
    this.treasureItem.set(ti);
    this.treasureReward.set(ti.name);
    this.restAmount.set(Math.floor(Math.random() * 5) + 3);
  }

  // ── Seleção de alvo ───────────────────────────────────────────────

  canTarget(e: Enemy): boolean {
    return e.hp > 0 && this.phase() === 'player_turn';
  }

  setTarget(e: Enemy): void {
    if (this.canTarget(e)) this.targetId.set(e.id);
  }

  selectEnemy(e: Enemy): void {
    if (e.hp <= 0) return;
    if (this.phase() === 'player_turn') this.targetId.set(e.id);
    this.viewedEnemyId.set(this.viewedEnemyId() === e.id ? null : e.id);
  }

  // ── Ações de combate ──────────────────────────────────────────────

  onAttack(): void {
    const t = this.target();
    if (!t) return;
    const prevHp  = t.hp;
    const prevPv  = this.char()?.pontosVida.current ?? 0;
    this.combat.playerAttackTarget(t.id);
    this._flashEnemy(t.id, prevHp);
    this._flashParty(prevPv);
    this._advanceTarget();
  }

  onAttackMelee(): void {
    this.showAttackMenu.set(false);
    const t = this.target();
    if (!t) return;
    const prevHp = t.hp;
    const prevPv = this.char()?.pontosVida.current ?? 0;
    this.combat.playerAttackTarget(t.id);
    this._flashEnemy(t.id, prevHp);
    this._flashParty(prevPv);
    this._advanceTarget();
  }

  onAttackRanged(): void {
    this.showAttackMenu.set(false);
    const t = this.target();
    if (!t) return;
    const prevHp = t.hp;
    const prevPv = this.char()?.pontosVida.current ?? 0;
    this.combat.playerRangedAttackTarget(t.id);
    this._flashEnemy(t.id, prevHp);
    this._flashParty(prevPv);
    this._advanceTarget();
  }

  onAbility(ab: CombatAbility): void {
    const t = this.target();
    if (!t) return;
    const prevHp = t.hp;
    const prevPv = this.char()?.pontosVida.current ?? 0;
    this.combat.playerUseAbilityTarget(ab, t.id);
    this.showMagicMenu.set(false);
    this._flashEnemy(t.id, prevHp);
    this._flashParty(prevPv);
    this._advanceTarget();
  }

  onFlee(): void { this.combat.playerFlee(); }

  canUse(ab: CombatAbility): boolean { return this.combat.canUseAbility(ab); }

  usePotion(): void {
    // Legacy: show inventory menu instead
    this.showInventory.set(true);
  }

  useItem(item: Item): void {
    if (this.phase() !== 'player_turn') return;
    const used = this.gs.useConsumable(item);
    if (used) {
      this.showInventory.set(false);
      // Scroll damage (pergaminhos)
      if (item.damageDice && (item.damageDice ?? 0) > 0) {
        const target = this.combat.enemies()[0];
        if (target) {
          let dmg = 0;
          for (let i = 0; i < item.damageDice; i++) dmg += Math.ceil(Math.random() * 6);
          this.combat['applyDamageToEnemy'](target.id, dmg);
          this.gs.addLog(`${item.icon} ${item.name} causa ${dmg} de dano mágico em ${target.name}!`);
          if (!this.combat['checkVictory']()) {
            this.combat['afterPlayerAction']();
          }
          return;
        }
      }
      this.combat['afterPlayerAction']();
    }
  }

  // ── Helpers visuais ───────────────────────────────────────────────

  hpPct(e: Enemy)           { return Math.max(0, (e.hp / e.maxHp) * 100); }
  pvPct(m: Character)       { return m.pontosVida.max > 0 ? Math.round(m.pontosVida.current / m.pontosVida.max * 100) : 0; }
  pmPct(m: Character)       { return m.pontosMana.max > 0 ? Math.round(m.pontosMana.current / m.pontosMana.max * 100) : 0; }

  classColor(m: Character): string {
    const COLORS: Record<string, string> = {
      guerreiro: '#c0392b', mago: '#8e44ad', ladino: '#2c3e50',
      clerigo: '#f39c12', ranger: '#27ae60', bardo: '#16a085',
      druida: '#1e8449', paladino: '#d4ac0d', barbaro: '#922b21', monge: '#117a65'
    };
    return COLORS[m.class] ?? '#888';
  }

  classIcon(m: Character): string {
    const ICONS: Record<string, string> = {
      guerreiro: '⚔️', mago: '🔮', ladino: '🗡️', clerigo: '🌟',
      ranger: '🏹', bardo: '🎵', druida: '🌿', paladino: '🛡️',
      barbaro: '🪓', monge: '👊'
    };
    return ICONS[m.class] ?? '👤';
  }

  private _flashEnemy(id: string, prevHp: number): void {
    setTimeout(() => {
      const e = this.enemies().find(en => en.id === id);
      if (e && e.hp < prevHp) {
        this.hitAnimId.set(id);
        setTimeout(() => this.hitAnimId.set(null), 350);
      }
    }, 50);
  }

  private _flashParty(prevPv: number): void {
    setTimeout(() => {
      const cur = this.char()?.pontosVida.current ?? prevPv;
      const c = this.char();
      if (c && cur < prevPv) {
        this.hitMemberId.set(c.id);
        setTimeout(() => this.hitMemberId.set(null), 450);
      }
    }, 950);
  }

  private _advanceTarget(): void {
    // Se o inimigo atual morreu, seleciona o próximo vivo
    setTimeout(() => {
      const cur = this.targetId();
      const alive = this.enemies().find(e => e.hp > 0);
      if (!this.enemies().find(e => e.id === cur && e.hp > 0) && alive) {
        this.targetId.set(alive.id);
      }
    }, 100);
  }

  // ── Armadilha ─────────────────────────────────────────────────────

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

  victory(): void {
    const ti = this.treasureItem();
    if (ti) this.gs.addToInventory(ti);
    this.gs.resolveEncounter('victory');
  }

  rest(): void {
    const amt = this.restAmount();
    this.gs.character.update(c => c ? {
      ...c,
      pontosVida: { ...c.pontosVida, current: Math.min(c.pontosVida.max, c.pontosVida.current + amt) },
      pontosMana: { ...c.pontosMana, current: c.pontosMana.max }
    } : c);
    this.gs.addLog(`🔥 Descansou: +${amt} PV, PM restaurados.`);
    this.gs.resolveEncounter('victory');
  }

  private pickTreasureItem(): Item {
    return rollTreasureItem(this.floorNum());
  }

  /** @deprecated kept for reference */
  private pickTreasure(): string {
    return this.pickTreasureItem().name;
  }
}
