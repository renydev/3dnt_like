import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/services/game-state.service';
import { Character } from '../../core/models/character.model';
import {
  RACES, CLASSES, VANTAGENS, DESVANTAGENS, VANTAGEM_CATEGORIES,
  Race, ClassDef, VantagemDef, DesvantagemDef
} from '../../core/models/character-creation.model';

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="creation-wrapper">

      <!-- Header com steps -->
      <div class="creation-header">
        <button class="btn-back" (click)="gameState.screen.set('menu')">← Voltar</button>
        <div class="step-indicator">
          @for (s of steps; track s.n) {
            <div class="step" [class.active]="step() === s.n" [class.done]="step() > s.n" (click)="step() > s.n && goToStep(s.n)">
              <div class="step-circle">{{ step() > s.n ? '✓' : s.n }}</div>
              <span class="step-label">{{ s.label }}</span>
            </div>
            @if (!$last) { <div class="step-line" [class.done]="step() > s.n"></div> }
          }
        </div>
      </div>

      <div class="creation-body">

        <!-- Painel lateral - preview do personagem -->
        <div class="char-preview">
          <div class="preview-name">
            <input
              class="name-input"
              [(ngModel)]="charName"
              placeholder="Nome do herói..."
              maxlength="24"
            />
          </div>

          @if (selectedRace()) {
            <div class="preview-section">
              <span class="preview-race-class">{{ selectedRace()!.icon }} {{ selectedRace()!.name }}</span>
              @if (selectedClass()) {
                <span class="preview-race-class">{{ selectedClass()!.icon }} {{ selectedClass()!.name }}</span>
              }
            </div>
          }

          @if (selectedClass()) {
            <div class="preview-stats">
              <div class="stat-row"><span class="stat-l">Força</span><div class="stat-pips">@for (p of pip(finalStats().forca, 5); track $index) { <div class="pip" [class.filled]="p"></div> }</div><span class="stat-v">{{ finalStats().forca }}</span></div>
              <div class="stat-row"><span class="stat-l">Habilidade</span><div class="stat-pips">@for (p of pip(finalStats().habilidade, 5); track $index) { <div class="pip" [class.filled]="p"></div> }</div><span class="stat-v">{{ finalStats().habilidade }}</span></div>
              <div class="stat-row"><span class="stat-l">Resistência</span><div class="stat-pips">@for (p of pip(finalStats().resistencia, 5); track $index) { <div class="pip" [class.filled]="p"></div> }</div><span class="stat-v">{{ finalStats().resistencia }}</span></div>
              <div class="stat-row"><span class="stat-l">Armadura</span><div class="stat-pips">@for (p of pip(finalStats().armadura, 5); track $index) { <div class="pip" [class.filled]="p"></div> }</div><span class="stat-v">{{ finalStats().armadura }}</span></div>
              @if (finalStats().pontosMagia > 0) {
                <div class="stat-row pm-row"><span class="stat-l">Pts Magia</span><span class="stat-v pm-v">{{ finalStats().pontosMagia }}</span></div>
              }
              <div class="stat-row pv-row"><span class="stat-l">Pts Vida</span><span class="stat-v pv-v">{{ finalStats().resistencia * 5 }}</span></div>
            </div>
          }

          <!-- Vantagens coletadas -->
          @if (allVantagens().length > 0) {
            <div class="preview-vantagens">
              <div class="preview-section-title">Vantagens</div>
              @for (v of allVantagens(); track v) {
                <div class="preview-tag v-tag">{{ v }}</div>
              }
            </div>
          }

          @if (selectedDesvantagens().length > 0) {
            <div class="preview-vantagens">
              <div class="preview-section-title">Desvantagens</div>
              @for (d of selectedDesvantagens(); track d) {
                <div class="preview-tag d-tag">{{ getDesv(d)?.icon }} {{ getDesv(d)?.name }}</div>
              }
            </div>
          }

          @if (step() === 3) {
            <div class="points-display" [class.zero]="pointsLeft() === 0" [class.negative]="pointsLeft() < 0">
              <span class="points-num">{{ pointsLeft() }}</span>
              <span class="points-label">pontos restantes</span>
            </div>
          }
        </div>

        <!-- Área principal por step -->
        <div class="creation-main">

          <!-- STEP 1: RAÇA -->
          @if (step() === 1) {
            <div class="step-content">
              <h2 class="step-title">Escolha sua Raça</h2>
              <p class="step-desc">Sua origem molda seus atributos naturais e talentos inatos.</p>
              <div class="cards-grid race-grid">
                @for (race of races; track race.id) {
                  <div
                    class="option-card"
                    [class.selected]="selectedRace()?.id === race.id"
                    (click)="selectRace(race)"
                  >
                    <div class="card-icon">{{ race.icon }}</div>
                    <div class="card-body">
                      <div class="card-name">{{ race.name }}</div>
                      <p class="card-lore">{{ race.lore }}</p>
                      <ul class="card-traits">
                        @for (t of race.traits; track t) {
                          <li>{{ t }}</li>
                        }
                      </ul>
                      <div class="card-free-tag">✨ Grátis: {{ race.freeVantagem }}</div>
                    </div>
                    @if (selectedRace()?.id === race.id) {
                      <div class="selected-check">✓</div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- STEP 2: CLASSE -->
          @if (step() === 2) {
            <div class="step-content">
              <h2 class="step-title">Escolha sua Classe</h2>
              <p class="step-desc">Sua classe define seu papel no labirinto e seu estilo de combate.</p>
              <div class="cards-grid class-grid">
                @for (cls of classes; track cls.id) {
                  <div
                    class="option-card class-card"
                    [class.selected]="selectedClass()?.id === cls.id"
                    (click)="selectClass(cls)"
                  >
                    <div class="class-card-top">
                      <div class="card-icon">{{ cls.icon }}</div>
                      <div>
                        <div class="card-name">{{ cls.name }}</div>
                        <div class="class-role">{{ cls.role }}</div>
                        <span class="difficulty-badge" [style.background]="cls.difficultyColor">{{ cls.difficulty }}</span>
                      </div>
                    </div>
                    <p class="card-lore">{{ cls.lore }}</p>
                    <div class="class-stats-mini">
                      <span [class.high]="cls.baseStats.forca >= 3">F{{ cls.baseStats.forca }}</span>
                      <span [class.high]="cls.baseStats.habilidade >= 3">H{{ cls.baseStats.habilidade }}</span>
                      <span [class.high]="cls.baseStats.resistencia >= 3">R{{ cls.baseStats.resistencia }}</span>
                      <span [class.high]="cls.baseStats.armadura >= 3">A{{ cls.baseStats.armadura }}</span>
                      @if (cls.baseStats.pontosMagia > 0) {
                        <span class="high">PM{{ cls.baseStats.pontosMagia }}</span>
                      }
                    </div>
                    <div class="card-free-tag">⚡ Grátis: {{ cls.freeVantagem }}</div>
                    <p class="class-playstyle">{{ cls.playstyle }}</p>
                    @if (selectedClass()?.id === cls.id) {
                      <div class="selected-check">✓</div>
                    }
                  </div>
                }
              </div>
            </div>
          }

          <!-- STEP 3: VANTAGENS & DESVANTAGENS -->
          @if (step() === 3) {
            <div class="step-content">
              <h2 class="step-title">Vantagens & Desvantagens</h2>
              <p class="step-desc">
                Você tem <strong>{{ totalPoints() }} pontos</strong> para gastar em vantagens.
                Desvantagens devolvem pontos (máximo 2).
              </p>

              <div class="vd-layout">

                <!-- Vantagens -->
                <div class="vd-col">
                  <div class="vd-col-title">⭐ Vantagens</div>
                  @for (cat of categories; track cat.id) {
                    <div class="vd-category">
                      <div class="vd-cat-label">{{ cat.icon }} {{ cat.label }}</div>
                      @for (v of vantagensByCategory(cat.id); track v.id) {
                        <div
                          class="vd-item"
                          [class.selected]="isVantagemSelected(v.id)"
                          [class.disabled]="!canSelectVantagem(v)"
                          (click)="toggleVantagem(v)"
                        >
                          <div class="vdi-top">
                            <span class="vdi-icon">{{ v.icon }}</span>
                            <span class="vdi-name">{{ v.name }}</span>
                            <span class="vdi-cost">{{ isVantagemSelected(v.id) ? '−' : '+' }}{{ v.cost }}pt{{ v.cost > 1 ? 's' : '' }}</span>
                          </div>
                          <p class="vdi-effect">{{ v.effect }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>

                <!-- Desvantagens -->
                <div class="vd-col">
                  <div class="vd-col-title">⚠️ Desvantagens <span class="desv-limit">(máx. 2)</span></div>
                  @for (d of desvantagens; track d.id) {
                    <div
                      class="vd-item desv-item"
                      [class.selected]="isDesvSelected(d.id)"
                      [class.disabled]="!canSelectDesv(d)"
                      (click)="toggleDesv(d)"
                    >
                      <div class="vdi-top">
                        <span class="vdi-icon">{{ d.icon }}</span>
                        <span class="vdi-name">{{ d.name }}</span>
                        <span class="vdi-cost refund">+{{ d.refund }}pt{{ d.refund > 1 ? 's' : '' }}</span>
                      </div>
                      <p class="vdi-effect desv-effect">{{ d.penalty }}</p>
                    </div>
                  }
                </div>

              </div>
            </div>
          }

        </div>
      </div>

      <!-- Footer com navegação -->
      <div class="creation-footer">
        @if (step() > 1) {
          <button class="btn-prev" (click)="prevStep()">← Voltar</button>
        } @else {
          <div></div>
        }

        @if (step() < 3) {
          <button
            class="btn-next"
            [disabled]="!canAdvance()"
            (click)="nextStep()"
          >
            Próximo →
          </button>
        } @else {
          <button
            class="btn-confirm"
            [disabled]="!canConfirm()"
            (click)="confirm()"
          >
            ⚔️ Entrar no Labirinto
          </button>
        }
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .creation-wrapper {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #0a0a0f;
      color: #e8d5b0;
      font-family: 'Segoe UI', sans-serif;
    }

    /* ── HEADER ── */
    .creation-header {
      display: flex;
      align-items: center;
      gap: 2rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #2a2a3e;
      background: #0d0d1a;
      flex-shrink: 0;
    }

    .btn-back {
      background: none;
      border: 1px solid #3a3a5e;
      color: #a89060;
      padding: .4rem .9rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: .85rem;
      white-space: nowrap;
      transition: all .2s;
      &:hover { border-color: #c9a84c; color: #c9a84c; }
    }

    .step-indicator {
      display: flex;
      align-items: center;
      gap: 0;
      flex: 1;
      justify-content: center;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .3rem;
      cursor: default;
      &.done { cursor: pointer; }
    }

    .step-circle {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 2px solid #3a3a5e;
      display: flex; align-items: center; justify-content: center;
      font-size: .85rem; font-weight: 700;
      background: #0d0d1a;
      color: #5a5a7a;
      transition: all .3s;

      .step.active & { border-color: #c9a84c; color: #c9a84c; background: #1a1a2e; }
      .step.done & { border-color: #27ae60; color: #27ae60; background: #0d1a12; }
    }

    .step-label {
      font-size: .7rem;
      color: #5a5a7a;
      .step.active & { color: #c9a84c; }
      .step.done & { color: #27ae60; }
    }

    .step-line {
      width: 80px; height: 2px;
      background: #2a2a3e;
      margin: 0 .5rem;
      margin-bottom: 1.2rem;
      transition: background .3s;
      &.done { background: #27ae60; }
    }

    /* ── BODY ── */
    .creation-body {
      display: flex;
      flex: 1;
      overflow: hidden;
      gap: 0;
    }

    /* ── PREVIEW LATERAL ── */
    .char-preview {
      width: 220px;
      flex-shrink: 0;
      background: #0d0d1a;
      border-right: 1px solid #2a2a3e;
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: .8rem;
    }

    .name-input {
      width: 100%;
      background: #1a1a2e;
      border: 1px solid #3a3a5e;
      border-radius: 6px;
      color: #e8d5b0;
      padding: .5rem .7rem;
      font-size: .9rem;
      outline: none;
      box-sizing: border-box;
      &:focus { border-color: #c9a84c; }
      &::placeholder { color: #5a5a7a; }
    }

    .preview-section {
      display: flex;
      flex-direction: column;
      gap: .3rem;
    }

    .preview-race-class {
      font-size: .85rem;
      color: #c9a84c;
      font-weight: 600;
    }

    .preview-stats {
      display: flex;
      flex-direction: column;
      gap: .4rem;
      border-top: 1px solid #2a2a3e;
      padding-top: .8rem;
    }

    .stat-row {
      display: flex;
      align-items: center;
      gap: .4rem;
    }

    .stat-l {
      font-size: .7rem;
      color: #7a7a9a;
      width: 70px;
      flex-shrink: 0;
    }

    .stat-pips {
      display: flex;
      gap: 2px;
      flex: 1;
    }

    .pip {
      width: 10px; height: 10px;
      border-radius: 2px;
      border: 1px solid #3a3a5e;
      background: #1a1a2e;
      &.filled { background: #c9a84c; border-color: #c9a84c; }
    }

    .stat-v {
      font-size: .8rem;
      font-weight: 700;
      color: #e8d5b0;
      width: 16px;
      text-align: right;
    }

    .pm-row .stat-v.pm-v { color: #8e44ad; }
    .pv-row .stat-v.pv-v { color: #e74c3c; }
    .pm-row .stat-l, .pv-row .stat-l { color: #9a7aaa; }

    .preview-vantagens {
      border-top: 1px solid #2a2a3e;
      padding-top: .6rem;
      display: flex;
      flex-direction: column;
      gap: .3rem;
    }

    .preview-section-title {
      font-size: .65rem;
      color: #7a7a9a;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: .2rem;
    }

    .preview-tag {
      font-size: .7rem;
      padding: .2rem .5rem;
      border-radius: 4px;
      &.v-tag { background: #1a2a1a; border: 1px solid #2a4a2a; color: #7ecf7e; }
      &.d-tag { background: #2a1a1a; border: 1px solid #4a2a2a; color: #cf7e7e; }
    }

    .points-display {
      margin-top: auto;
      background: #1a1a2e;
      border: 2px solid #c9a84c;
      border-radius: 8px;
      padding: .8rem;
      text-align: center;
      &.zero { border-color: #27ae60; }
      &.negative { border-color: #e74c3c; }
    }

    .points-num {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: #c9a84c;
      .zero & { color: #27ae60; }
      .negative & { color: #e74c3c; }
    }

    .points-label {
      font-size: .7rem;
      color: #7a7a9a;
    }

    /* ── MAIN AREA ── */
    .creation-main {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
    }

    .step-content { max-width: 900px; }

    .step-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #c9a84c;
      margin: 0 0 .3rem;
      font-family: 'Georgia', serif;
      letter-spacing: .04em;
    }

    .step-desc {
      color: #9a8a6a;
      font-size: .9rem;
      margin: 0 0 1.5rem;
    }

    /* ── CARDS ── */
    .cards-grid {
      display: grid;
      gap: 1rem;
    }

    .race-grid { grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .class-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

    .option-card {
      background: #0d0d1a;
      border: 2px solid #2a2a3e;
      border-radius: 10px;
      padding: 1rem;
      cursor: pointer;
      position: relative;
      transition: all .25s;
      display: flex;
      gap: 1rem;
      align-items: flex-start;

      &:hover { border-color: #5a5a8e; background: #12122a; transform: translateY(-2px); }
      &.selected { border-color: #c9a84c; background: #1a1a2e; box-shadow: 0 0 16px rgba(201,168,76,.25); }
    }

    .card-icon {
      font-size: 2rem;
      flex-shrink: 0;
      line-height: 1;
      margin-top: .2rem;
    }

    .card-body { flex: 1; }

    .card-name {
      font-size: 1.05rem;
      font-weight: 700;
      color: #e8d5b0;
      margin-bottom: .3rem;
    }

    .card-lore {
      font-size: .78rem;
      color: #8a7a5a;
      line-height: 1.5;
      margin: 0 0 .6rem;
    }

    .card-traits {
      list-style: none;
      padding: 0; margin: 0 0 .5rem;
      display: flex;
      flex-direction: column;
      gap: .2rem;
      li {
        font-size: .75rem;
        color: #a89060;
        &::before { content: '• '; color: #c9a84c; }
      }
    }

    .card-free-tag {
      font-size: .72rem;
      color: #7ecf7e;
      background: #0d1a0d;
      border: 1px solid #2a4a2a;
      border-radius: 4px;
      padding: .2rem .5rem;
      display: inline-block;
    }

    .selected-check {
      position: absolute;
      top: .5rem; right: .7rem;
      font-size: 1.1rem;
      color: #c9a84c;
      font-weight: 800;
    }

    /* ── CLASS CARD EXTRAS ── */
    .class-card { flex-direction: column; }

    .class-card-top {
      display: flex;
      gap: .8rem;
      align-items: flex-start;
      margin-bottom: .5rem;
    }

    .class-role {
      font-size: .75rem;
      color: #7a7a9a;
      margin: .1rem 0;
    }

    .difficulty-badge {
      font-size: .65rem;
      font-weight: 700;
      padding: .15rem .4rem;
      border-radius: 3px;
      color: #fff;
      text-transform: uppercase;
      letter-spacing: .06em;
    }

    .class-stats-mini {
      display: flex;
      gap: .5rem;
      flex-wrap: wrap;
      margin: .5rem 0;
      span {
        font-size: .75rem;
        background: #1a1a2e;
        border: 1px solid #3a3a5e;
        border-radius: 4px;
        padding: .1rem .4rem;
        color: #7a7a9a;
        &.high { color: #c9a84c; border-color: #5a4a2e; }
      }
    }

    .class-playstyle {
      font-size: .72rem;
      color: #6a7a8a;
      font-style: italic;
      margin: .3rem 0 0;
    }

    /* ── VANTAGENS / DESVANTAGENS ── */
    .vd-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .vd-col-title {
      font-size: 1rem;
      font-weight: 700;
      color: #c9a84c;
      margin-bottom: .8rem;
      padding-bottom: .4rem;
      border-bottom: 1px solid #2a2a3e;
    }

    .desv-limit {
      font-size: .7rem;
      color: #9a7a5a;
      font-weight: 400;
    }

    .vd-category { margin-bottom: 1.2rem; }

    .vd-cat-label {
      font-size: .7rem;
      color: #7a7a9a;
      text-transform: uppercase;
      letter-spacing: .08em;
      margin-bottom: .4rem;
    }

    .vd-item {
      background: #0d0d1a;
      border: 1px solid #2a2a3e;
      border-radius: 7px;
      padding: .6rem .8rem;
      margin-bottom: .4rem;
      cursor: pointer;
      transition: all .2s;

      &:hover:not(.disabled) { border-color: #5a5a8e; background: #12122a; }
      &.selected { border-color: #c9a84c; background: #1a1a2e; }
      &.disabled { opacity: .4; cursor: not-allowed; }
      &.desv-item.selected { border-color: #e74c3c; background: #1a0d0d; }
    }

    .vdi-top {
      display: flex;
      align-items: center;
      gap: .5rem;
      margin-bottom: .2rem;
    }

    .vdi-icon { font-size: 1rem; }
    .vdi-name { flex: 1; font-size: .82rem; font-weight: 600; color: #e8d5b0; }
    .vdi-cost {
      font-size: .72rem;
      font-weight: 700;
      background: #1a2a1a;
      border: 1px solid #2a4a2a;
      color: #7ecf7e;
      padding: .1rem .35rem;
      border-radius: 4px;
      &.refund { background: #2a1a1a; border-color: #4a2a2a; color: #cf7e7e; }
    }

    .vdi-effect {
      font-size: .72rem;
      color: #7a7a9a;
      margin: 0;
      padding-left: 1.5rem;
    }

    .desv-effect { color: #9a5a5a; }

    /* ── FOOTER ── */
    .creation-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: .8rem 1.5rem;
      border-top: 1px solid #2a2a3e;
      background: #0d0d1a;
      flex-shrink: 0;
    }

    .btn-prev {
      background: none;
      border: 1px solid #3a3a5e;
      color: #a89060;
      padding: .5rem 1.2rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: .9rem;
      transition: all .2s;
      &:hover { border-color: #c9a84c; color: #c9a84c; }
    }

    .btn-next {
      background: linear-gradient(135deg, #c9a84c, #a07830);
      border: none;
      color: #0a0a0f;
      font-weight: 700;
      padding: .6rem 1.8rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: .95rem;
      transition: all .2s;
      &:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
      &:disabled { opacity: .4; cursor: not-allowed; transform: none; }
    }

    .btn-confirm {
      background: linear-gradient(135deg, #8b0000, #c0392b);
      border: 2px solid #e74c3c;
      color: #fff;
      font-weight: 800;
      padding: .7rem 2rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      letter-spacing: .03em;
      transition: all .2s;
      &:hover:not(:disabled) { box-shadow: 0 0 20px rgba(231,76,60,.4); transform: translateY(-1px); }
      &:disabled { opacity: .4; cursor: not-allowed; transform: none; }
    }
  `]
})
export class CharacterCreationComponent {
  gameState = inject(GameStateService);

  races = RACES;
  classes = CLASSES;
  vantagens = VANTAGENS;
  desvantagens = DESVANTAGENS;
  categories = VANTAGEM_CATEGORIES;
  steps = [{ n: 1, label: 'Raça' }, { n: 2, label: 'Classe' }, { n: 3, label: 'Vantagens' }];

  step = signal(1);
  charName = 'Aventureiro';
  selectedRace = signal<Race | null>(null);
  selectedClass = signal<ClassDef | null>(null);
  selectedVantagens = signal<string[]>([]);
  selectedDesvantagens = signal<string[]>([]);

  totalPoints = computed(() => {
    const raceBonus = this.selectedRace()?.bonusPoints ?? 0;
    const desvRefund = this.selectedDesvantagens()
      .reduce((s, id) => s + (DESVANTAGENS.find(d => d.id === id)?.refund ?? 0), 0);
    return 5 + raceBonus + desvRefund;
  });

  spentPoints = computed(() =>
    this.selectedVantagens()
      .reduce((s, id) => s + (VANTAGENS.find(v => v.id === id)?.cost ?? 0), 0)
  );

  pointsLeft = computed(() => this.totalPoints() - this.spentPoints());

  finalStats = computed(() => {
    const cls = this.selectedClass();
    const race = this.selectedRace();
    if (!cls) return { forca: 1, habilidade: 1, resistencia: 1, armadura: 0, pontosMagia: 0 };

    const mods = race?.modifiers ?? {};
    let s = { ...cls.baseStats };
    s.forca = Math.max(1, s.forca + (mods.forca ?? 0));
    s.habilidade = Math.max(1, s.habilidade + (mods.habilidade ?? 0));
    s.resistencia = Math.max(1, s.resistencia + (mods.resistencia ?? 0));
    s.armadura = Math.max(0, s.armadura + (mods.armadura ?? 0));
    s.pontosMagia = Math.max(0, s.pontosMagia + (mods.pontosMagia ?? 0));

    // Vantagens que alteram stats
    if (this.isVantagemSelected('armadura_pesada')) s.armadura += 1;
    if (this.isVantagemSelected('magia_aprimorada')) s.pontosMagia += 4;

    return s;
  });

  allVantagens = computed(() => {
    const list: string[] = [];
    const race = this.selectedRace();
    const cls = this.selectedClass();
    if (race) list.push(race.freeVantagem);
    if (cls) list.push(cls.freeVantagem);
    this.selectedVantagens().forEach(id => {
      const v = VANTAGENS.find(x => x.id === id);
      if (v) list.push(v.name);
    });
    return list;
  });

  vantagensByCategory(cat: string): VantagemDef[] {
    return VANTAGENS.filter(v => v.category === cat);
  }

  isVantagemSelected(id: string) { return this.selectedVantagens().includes(id); }
  isDesvSelected(id: string) { return this.selectedDesvantagens().includes(id); }
  getDesv(id: string) { return DESVANTAGENS.find(d => d.id === id); }

  canSelectVantagem(v: VantagemDef): boolean {
    if (this.isVantagemSelected(v.id)) return true;
    if (this.pointsLeft() < v.cost) return false;
    const incompatible = v.incompatibleWith ?? [];
    if (incompatible.some(id => this.isVantagemSelected(id))) return false;
    return true;
  }

  canSelectDesv(d: DesvantagemDef): boolean {
    if (this.isDesvSelected(d.id)) return true;
    return this.selectedDesvantagens().length < 2;
  }

  toggleVantagem(v: VantagemDef) {
    if (this.isVantagemSelected(v.id)) {
      this.selectedVantagens.update(l => l.filter(x => x !== v.id));
    } else if (this.canSelectVantagem(v)) {
      this.selectedVantagens.update(l => [...l, v.id]);
    }
  }

  toggleDesv(d: DesvantagemDef) {
    if (this.isDesvSelected(d.id)) {
      this.selectedDesvantagens.update(l => l.filter(x => x !== d.id));
    } else if (this.canSelectDesv(d)) {
      this.selectedDesvantagens.update(l => [...l, d.id]);
    }
  }

  selectRace(r: Race) { this.selectedRace.set(r); }
  selectClass(c: ClassDef) { this.selectedClass.set(c); }
  goToStep(n: number) { this.step.set(n); }

  canAdvance(): boolean {
    if (this.step() === 1) return !!this.selectedRace();
    if (this.step() === 2) return !!this.selectedClass();
    return true;
  }

  canConfirm(): boolean {
    return !!this.selectedRace() && !!this.selectedClass() && this.pointsLeft() >= 0 && this.charName.trim().length > 0;
  }

  nextStep() { if (this.canAdvance()) this.step.update(s => s + 1); }
  prevStep() { this.step.update(s => s - 1); }

  pip(val: number, max: number): boolean[] {
    return Array.from({ length: max }, (_, i) => i < val);
  }

  confirm() {
    if (!this.canConfirm()) return;
    const stats = this.finalStats();
    const pv = stats.resistencia * 5;

    const character: Character = {
      id: crypto.randomUUID(),
      name: this.charName.trim() || 'Aventureiro',
      class: this.selectedClass()!.id,
      race: this.selectedRace()!.id,
      level: 1,
      xp: 0,
      xpToNextLevel: 100,
      forca: { base: stats.forca, current: stats.forca, max: stats.forca },
      habilidade: { base: stats.habilidade, current: stats.habilidade, max: stats.habilidade },
      resistencia: { base: stats.resistencia, current: stats.resistencia, max: stats.resistencia },
      armadura: stats.armadura,
      pontosMagia: { base: stats.pontosMagia, current: stats.pontosMagia, max: stats.pontosMagia },
      pontosVida: { base: pv, current: pv, max: pv },
      vantagens: this.allVantagens(),
      desvantagens: this.selectedDesvantagens().map(id => this.getDesv(id)!.name),
      gold: 20,
      items: ['Poção de Cura'],
      statusEffects: []
    };

    this.gameState.startCustomGame(character);
  }
}
