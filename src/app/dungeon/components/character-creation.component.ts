import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStateService } from '../../core/services/game-state.service';
import { GameDataService } from '../../core/services/game-data.service';
import { Character } from '../../core/models/character.model';
import { Race } from '../../core/data/races.data';
import { ClassDef } from '../../core/data/classes.data';
import { VANTAGENS, DESVANTAGENS, VANTAGEM_CATEGORIES, VantagemDef, DesvantagemDef } from '../../core/models/character-creation.model';

const DIFFICULTY_COLORS: Record<string, string> = {
  'Iniciante': '#27ae60',
  'Intermediário': '#e67e22',
  'Avançado': '#8e44ad',
};

@Component({
  selector: 'app-character-creation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="creation-wrapper">

      <!-- Header -->
      <div class="creation-header">
        <button class="btn-back" (click)="gameState.screen.set('menu')">← Voltar</button>
        <div class="step-indicator">
          @for (s of steps; track s.n) {
            <div class="step" [class.active]="step() === s.n" [class.done]="step() > s.n"
                 (click)="step() > s.n && goToStep(s.n)">
              <div class="step-circle">{{ step() > s.n ? '✓' : s.n }}</div>
              <span class="step-label">{{ s.label }}</span>
            </div>
            @if (!$last) { <div class="step-line" [class.done]="step() > s.n"></div> }
          }
        </div>
      </div>

      <div class="creation-body">

        <!-- Painel lateral -->
        <div class="char-preview">
          <input class="name-input" [(ngModel)]="charName" placeholder="Nome do herói..." maxlength="24"/>

          @if (selectedRace()) {
            <div class="preview-badge" [style.border-color]="selectedRace()!.color">
              <span class="pb-icon">{{ selectedRace()!.icon }}</span>
              <div>
                <div class="pb-name">{{ selectedRace()!.name }}</div>
                <div class="pb-diff">{{ selectedRace()!.difficulty }}</div>
              </div>
            </div>
          }

          @if (selectedClass()) {
            <div class="preview-badge" [style.border-color]="selectedClass()!.color">
              <span class="pb-icon">{{ selectedClass()!.icon }}</span>
              <div>
                <div class="pb-name">{{ selectedClass()!.name }}</div>
                <div class="pb-diff">{{ selectedClass()!.role }}</div>
              </div>
            </div>
          }

          @if (selectedClass()) {
            <div class="preview-stats">
              @for (stat of statRows(); track stat.label) {
                <div class="stat-row">
                  <span class="stat-l">{{ stat.label }}</span>
                  <div class="stat-pips">
                    @for (p of pip(stat.value, 6); track $index) {
                      <div class="pip" [class.filled]="p" [style.background]="p ? stat.color : null"
                           [style.border-color]="p ? stat.color : null"></div>
                    }
                  </div>
                  <span class="stat-v" [style.color]="stat.color">{{ stat.value }}</span>
                </div>
              }
              <div class="pv-line">
                <span>PV</span>
                <strong [style.color]="'#e74c3c'">{{ finalStats().pontosVida }}</strong>
              </div>
              @if (finalStats().pontosMagia > 0) {
                <div class="pv-line">
                  <span>PM</span>
                  <strong [style.color]="'#8e44ad'">{{ finalStats().pontosMagia }}</strong>
                </div>
              }
            </div>
          }

          @if (allFreeVantagens().length > 0) {
            <div class="preview-block">
              <div class="pb-section-title">Habilidades Grátis</div>
              @for (v of allFreeVantagens(); track v) {
                <div class="preview-tag v-tag">✨ {{ v }}</div>
              }
            </div>
          }

          @if (selectedVantagensNames().length > 0) {
            <div class="preview-block">
              <div class="pb-section-title">Vantagens</div>
              @for (v of selectedVantagensNames(); track v) {
                <div class="preview-tag v-tag">⭐ {{ v }}</div>
              }
            </div>
          }

          @if (selectedDesvantagens().length > 0) {
            <div class="preview-block">
              <div class="pb-section-title">Desvantagens</div>
              @for (id of selectedDesvantagens(); track id) {
                <div class="preview-tag d-tag">⚠️ {{ getDesv(id)?.name }}</div>
              }
            </div>
          }

          @if (step() === 3) {
            <div class="points-display" [class.zero]="pointsLeft() === 0" [class.neg]="pointsLeft() < 0">
              <span class="points-num">{{ pointsLeft() }}</span>
              <span class="points-label">pontos restantes</span>
            </div>
          }
        </div>

        <!-- Área principal -->
        <div class="creation-main">

          <!-- STEP 1: RAÇA -->
          @if (step() === 1) {
            <div class="step-content">
              <h2 class="step-title">Escolha sua Raça</h2>
              <p class="step-desc">Sua origem molda seus atributos e talentos inatos. <span class="step-count">{{ gameData.races.length }} raças disponíveis</span></p>

              <!-- Filtro de dificuldade -->
              <div class="diff-filter">
                @for (d of ['Todas', 'Fácil', 'Médio', 'Difícil']; track d) {
                  <button class="diff-btn" [class.active]="raceDiffFilter() === d" (click)="raceDiffFilter.set(d)">{{ d }}</button>
                }
              </div>

              <div class="cards-grid race-grid">
                @for (race of filteredRaces(); track race.id) {
                  <div class="option-card race-card"
                       [class.selected]="selectedRace()?.id === race.id"
                       [style.--accent]="race.color"
                       (click)="selectRace(race)">

                    <div class="race-card-header">
                      <span class="card-icon">{{ race.icon }}</span>
                      <div class="race-card-title">
                        <div class="card-name">{{ race.name }}</div>
                        <span class="diff-badge diff-{{ race.difficulty }}">{{ race.difficulty }}</span>
                      </div>
                      @if (selectedRace()?.id === race.id) {
                        <span class="selected-check">✓</span>
                      }
                    </div>

                    <p class="card-lore">{{ race.lore }}</p>

                    <div class="modifiers-row">
                      @if (race.modifiers.forca) {
                        <span class="mod-chip" [class.pos]="race.modifiers.forca! > 0" [class.neg]="race.modifiers.forca! < 0">
                          F{{ race.modifiers.forca! > 0 ? '+' : '' }}{{ race.modifiers.forca }}
                        </span>
                      }
                      @if (race.modifiers.habilidade) {
                        <span class="mod-chip" [class.pos]="race.modifiers.habilidade! > 0" [class.neg]="race.modifiers.habilidade! < 0">
                          H{{ race.modifiers.habilidade! > 0 ? '+' : '' }}{{ race.modifiers.habilidade }}
                        </span>
                      }
                      @if (race.modifiers.resistencia) {
                        <span class="mod-chip" [class.pos]="race.modifiers.resistencia! > 0" [class.neg]="race.modifiers.resistencia! < 0">
                          R{{ race.modifiers.resistencia! > 0 ? '+' : '' }}{{ race.modifiers.resistencia }}
                        </span>
                      }
                      @if (race.modifiers.armadura) {
                        <span class="mod-chip" [class.pos]="race.modifiers.armadura! > 0" [class.neg]="race.modifiers.armadura! < 0">
                          A{{ race.modifiers.armadura! > 0 ? '+' : '' }}{{ race.modifiers.armadura }}
                        </span>
                      }
                      @if (race.modifiers.pontosMagia) {
                        <span class="mod-chip" [class.pos]="race.modifiers.pontosMagia! > 0" [class.neg]="race.modifiers.pontosMagia! < 0">
                          PM{{ race.modifiers.pontosMagia! > 0 ? '+' : '' }}{{ race.modifiers.pontosMagia }}
                        </span>
                      }
                      @if (race.bonusPoints > 0) {
                        <span class="mod-chip pos">+{{ race.bonusPoints }}PP</span>
                      }
                    </div>

                    @if (race.freeVantagens.length > 0) {
                      <div class="free-skills">
                        @for (v of race.freeVantagens; track v.name) {
                          <div class="free-skill-item" [title]="v.description">
                            <span class="fsi-dot">●</span>{{ v.name }}
                          </div>
                        }
                      </div>
                    }

                    @if (race.freeDesvantagens.length > 0) {
                      <div class="free-desv">
                        @for (d of race.freeDesvantagens; track d.name) {
                          <div class="free-desv-item" [title]="d.description">⚠️ {{ d.name }}</div>
                        }
                      </div>
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
              <p class="step-desc">Seu papel no labirinto. <span class="step-count">{{ gameData.classes.length }} classes disponíveis</span></p>

              <div class="diff-filter">
                @for (d of ['Todas', 'Iniciante', 'Intermediário', 'Avançado']; track d) {
                  <button class="diff-btn" [class.active]="classDiffFilter() === d" (click)="classDiffFilter.set(d)">{{ d }}</button>
                }
              </div>

              <div class="cards-grid class-grid">
                @for (cls of filteredClasses(); track cls.id) {
                  <div class="option-card class-card"
                       [class.selected]="selectedClass()?.id === cls.id"
                       [style.--accent]="cls.color"
                       (click)="selectClass(cls)">

                    <div class="class-card-header">
                      <span class="class-big-icon" [style.color]="cls.color">{{ cls.icon }}</span>
                      <div>
                        <div class="card-name">{{ cls.name }}</div>
                        <div class="class-role">{{ cls.role }}</div>
                        <span class="diff-badge" [style.background]="diffColor(cls.difficulty)">{{ cls.difficulty }}</span>
                      </div>
                      @if (selectedClass()?.id === cls.id) {
                        <span class="selected-check">✓</span>
                      }
                    </div>

                    <p class="card-lore">{{ cls.lore }}</p>

                    <div class="stats-bar-row">
                      @for (s of classStatBars(cls); track s.label) {
                        <div class="stat-bar-item">
                          <span class="sbi-label">{{ s.label }}</span>
                          <div class="sbi-track">
                            <div class="sbi-fill" [style.width.%]="s.pct" [style.background]="cls.color"></div>
                          </div>
                          <span class="sbi-val">{{ s.value }}</span>
                        </div>
                      }
                    </div>

                    <div class="free-skills">
                      @for (v of cls.freeVantagens; track v.name) {
                        <div class="free-skill-item" [title]="v.description">
                          <span class="fsi-dot">⚡</span>{{ v.name }}
                        </div>
                      }
                    </div>

                    <p class="class-playstyle">{{ cls.playstyle }}</p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- STEP 3: VANTAGENS -->
          @if (step() === 3) {
            <div class="step-content">
              <h2 class="step-title">Vantagens & Desvantagens</h2>
              <p class="step-desc">
                Você tem <strong class="pts-strong">{{ totalPoints() }} pontos</strong> para gastar.
                Desvantagens devolvem pontos (máx. 2).
              </p>

              <div class="vd-layout">
                <div class="vd-col">
                  <div class="vd-col-title">⭐ Vantagens</div>
                  @for (cat of categories; track cat.id) {
                    <div class="vd-category">
                      <div class="vd-cat-label">{{ cat.icon }} {{ cat.label }}</div>
                      @for (v of vantagensByCategory(cat.id); track v.id) {
                        <div class="vd-item" [class.selected]="isVantagemSelected(v.id)"
                             [class.disabled]="!canSelectVantagem(v)" (click)="toggleVantagem(v)">
                          <div class="vdi-top">
                            <span class="vdi-icon">{{ v.icon }}</span>
                            <span class="vdi-name">{{ v.name }}</span>
                            <span class="vdi-cost">{{ isVantagemSelected(v.id) ? '−' : '+' }}{{ v.cost }}pt</span>
                          </div>
                          <p class="vdi-effect">{{ v.effect }}</p>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="vd-col">
                  <div class="vd-col-title">⚠️ Desvantagens <span class="desv-limit">(máx. 2)</span></div>
                  @for (d of desvantagens; track d.id) {
                    <div class="vd-item desv-item" [class.selected]="isDesvSelected(d.id)"
                         [class.disabled]="!canSelectDesv(d)" (click)="toggleDesv(d)">
                      <div class="vdi-top">
                        <span class="vdi-icon">{{ d.icon }}</span>
                        <span class="vdi-name">{{ d.name }}</span>
                        <span class="vdi-cost refund">+{{ d.refund }}pt</span>
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

      <!-- Footer -->
      <div class="creation-footer">
        @if (step() > 1) {
          <button class="btn-prev" (click)="prevStep()">← Anterior</button>
        } @else {
          <div></div>
        }
        @if (step() < 3) {
          <button class="btn-next" [disabled]="!canAdvance()" (click)="nextStep()">
            Próximo →
          </button>
        } @else {
          <button class="btn-confirm" [disabled]="!canConfirm()" (click)="confirm()">
            ⚔️ Entrar no Labirinto
          </button>
        }
      </div>

    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .creation-wrapper {
      display: flex; flex-direction: column; height: 100vh;
      background: #08080f; color: #e8d5b0; font-family: 'Segoe UI', sans-serif;
    }

    /* ── HEADER ── */
    .creation-header {
      display: flex; align-items: center; gap: 2rem;
      padding: .85rem 1.5rem;
      border-bottom: 1px solid #1e1e30;
      background: #0a0a18; flex-shrink: 0;
    }

    .btn-back {
      background: none; border: 1px solid #2e2e50; color: #8a7a5a;
      padding: .35rem .8rem; border-radius: 6px; cursor: pointer; font-size: .82rem;
      white-space: nowrap; transition: all .2s;
      &:hover { border-color: #c9a84c; color: #c9a84c; }
    }

    .step-indicator { display: flex; align-items: center; flex: 1; justify-content: center; }

    .step { display: flex; flex-direction: column; align-items: center; gap: .3rem; cursor: default;
      &.done { cursor: pointer; } }

    .step-circle {
      width: 34px; height: 34px; border-radius: 50%;
      border: 2px solid #2e2e50; background: #0a0a18;
      display: flex; align-items: center; justify-content: center;
      font-size: .82rem; font-weight: 700; color: #4a4a6a; transition: all .3s;
      .step.active & { border-color: #c9a84c; color: #c9a84c; background: #16160a; }
      .step.done & { border-color: #27ae60; color: #27ae60; background: #0a160a; }
    }

    .step-label { font-size: .68rem; color: #4a4a6a;
      .step.active & { color: #c9a84c; } .step.done & { color: #27ae60; } }

    .step-line { width: 80px; height: 2px; background: #1e1e30; margin: 0 .5rem 1.1rem; transition: background .3s;
      &.done { background: #27ae60; } }

    /* ── BODY ── */
    .creation-body { display: flex; flex: 1; overflow: hidden; }

    /* ── PREVIEW ── */
    .char-preview {
      width: 210px; flex-shrink: 0;
      background: #0a0a18; border-right: 1px solid #1e1e30;
      padding: .9rem; overflow-y: auto;
      display: flex; flex-direction: column; gap: .7rem;
    }

    .name-input {
      width: 100%; background: #12122a; border: 1px solid #2e2e50;
      border-radius: 6px; color: #e8d5b0; padding: .45rem .7rem;
      font-size: .88rem; outline: none; box-sizing: border-box;
      &:focus { border-color: #c9a84c; }
      &::placeholder { color: #4a4a6a; }
    }

    .preview-badge {
      display: flex; align-items: center; gap: .6rem;
      background: #10101e; border: 1px solid #2e2e50; border-radius: 8px;
      padding: .5rem .7rem; border-left-width: 3px;
    }

    .pb-icon { font-size: 1.4rem; }
    .pb-name { font-size: .82rem; font-weight: 700; color: #e8d5b0; }
    .pb-diff { font-size: .65rem; color: #6a6a8a; }

    .preview-stats { display: flex; flex-direction: column; gap: .35rem;
      border-top: 1px solid #1e1e30; padding-top: .6rem; }

    .stat-row { display: flex; align-items: center; gap: .35rem; }
    .stat-l { font-size: .68rem; color: #6a6a8a; width: 65px; flex-shrink: 0; }
    .stat-pips { display: flex; gap: 2px; flex: 1; }

    .pip {
      width: 9px; height: 9px; border-radius: 2px;
      border: 1px solid #2e2e50; background: #12122a; transition: all .2s;
      &.filled { background: #c9a84c; border-color: #c9a84c; }
    }

    .stat-v { font-size: .78rem; font-weight: 700; width: 16px; text-align: right; }

    .pv-line { display: flex; justify-content: space-between; align-items: center;
      font-size: .72rem; color: #6a6a8a; padding-top: .2rem;
      strong { font-size: .9rem; } }

    .preview-block { border-top: 1px solid #1e1e30; padding-top: .5rem;
      display: flex; flex-direction: column; gap: .25rem; }
    .pb-section-title { font-size: .62rem; color: #6a6a8a; text-transform: uppercase; letter-spacing: .07em; margin-bottom: .15rem; }
    .preview-tag { font-size: .68rem; padding: .18rem .45rem; border-radius: 4px;
      &.v-tag { background: #0a160a; border: 1px solid #1e3a1e; color: #7ecf7e; }
      &.d-tag { background: #160a0a; border: 1px solid #3a1e1e; color: #cf7e7e; }
    }

    .points-display {
      margin-top: auto; background: #12122a;
      border: 2px solid #c9a84c; border-radius: 8px; padding: .7rem;
      text-align: center; transition: border-color .3s;
      &.zero { border-color: #27ae60; }
      &.neg { border-color: #e74c3c; }
    }
    .points-num { display: block; font-size: 1.8rem; font-weight: 800; color: #c9a84c;
      .zero & { color: #27ae60; } .neg & { color: #e74c3c; } }
    .points-label { font-size: .65rem; color: #6a6a8a; }

    /* ── MAIN ── */
    .creation-main { flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem; }
    .step-content { max-width: 960px; }

    .step-title { font-size: 1.4rem; font-weight: 800; color: #c9a84c; margin: 0 0 .25rem;
      font-family: 'Georgia', serif; letter-spacing: .03em; }
    .step-desc { color: #8a7a5a; font-size: .85rem; margin: 0 0 1rem; }
    .step-count { color: #4a4a6a; font-size: .78rem; }
    .pts-strong { color: #c9a84c; }

    /* Filtro dificuldade */
    .diff-filter { display: flex; gap: .4rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .diff-btn {
      background: #10101e; border: 1px solid #2e2e50; color: #6a6a8a;
      padding: .3rem .7rem; border-radius: 4px; cursor: pointer; font-size: .78rem;
      transition: all .2s;
      &:hover { border-color: #5a5a8e; color: #a8a8c8; }
      &.active { border-color: #c9a84c; color: #c9a84c; background: #16160a; }
    }

    /* ── CARDS GRID ── */
    .cards-grid { display: grid; gap: .9rem; }
    .race-grid { grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); }
    .class-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

    .option-card {
      background: #0c0c1a; border: 2px solid #1e1e30; border-radius: 10px;
      padding: 1rem; cursor: pointer; position: relative; transition: all .25s;

      &:hover { border-color: color-mix(in srgb, var(--accent) 60%, transparent); background: #10102a;
        transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,.4); }
      &.selected { border-color: var(--accent); background: #10102a;
        box-shadow: 0 0 20px color-mix(in srgb, var(--accent) 30%, transparent); }
    }

    /* RACE CARD */
    .race-card-header { display: flex; align-items: center; gap: .7rem; margin-bottom: .6rem; }
    .card-icon { font-size: 2rem; flex-shrink: 0; }
    .race-card-title { flex: 1; }
    .card-name { font-size: 1rem; font-weight: 700; color: #e8d5b0; }

    .diff-badge {
      font-size: .6rem; font-weight: 700; padding: .12rem .4rem; border-radius: 3px;
      text-transform: uppercase; letter-spacing: .07em; color: #fff;
      &.diff-Fácil { background: #1a5c2e; color: #7ecf7e; border: 1px solid #27ae60; }
      &.diff-Médio { background: #5c3a1a; color: #f0a040; border: 1px solid #e67e22; }
      &.diff-Difícil { background: #4a1a5c; color: #c07ef0; border: 1px solid #8e44ad; }
      &.diff-Iniciante { background: #1a5c2e; color: #7ecf7e; border: 1px solid #27ae60; }
      &.diff-Intermediário { background: #5c3a1a; color: #f0a040; border: 1px solid #e67e22; }
      &.diff-Avançado { background: #4a1a5c; color: #c07ef0; border: 1px solid #8e44ad; }
    }

    .selected-check { position: absolute; top: .6rem; right: .8rem; font-size: 1rem;
      color: var(--accent, #c9a84c); font-weight: 800; }

    .card-lore { font-size: .76rem; color: #7a6a4a; line-height: 1.5; margin: 0 0 .6rem; }

    .modifiers-row { display: flex; flex-wrap: wrap; gap: .3rem; margin-bottom: .5rem; }
    .mod-chip {
      font-size: .72rem; font-weight: 700; padding: .1rem .35rem; border-radius: 4px;
      font-family: monospace;
      &.pos { background: #0a1a0a; border: 1px solid #2a5a2a; color: #7ecf7e; }
      &.neg { background: #1a0a0a; border: 1px solid #5a2a2a; color: #cf7e7e; }
    }

    .free-skills { display: flex; flex-direction: column; gap: .2rem; margin-top: .4rem; }
    .free-skill-item {
      font-size: .72rem; color: #90c890; display: flex; align-items: center; gap: .3rem;
      background: #0a160a; border: 1px solid #1a3a1a; border-radius: 4px; padding: .2rem .4rem;
      cursor: help;
    }
    .fsi-dot { color: #27ae60; font-size: .5rem; }

    .free-desv { display: flex; flex-direction: column; gap: .2rem; margin-top: .3rem; }
    .free-desv-item { font-size: .72rem; color: #cf9090; background: #160a0a;
      border: 1px solid #3a1a1a; border-radius: 4px; padding: .2rem .4rem; cursor: help; }

    /* CLASS CARD */
    .class-card { flex-direction: column; }
    .class-card-header { display: flex; align-items: flex-start; gap: .8rem; margin-bottom: .5rem; position: relative; }
    .class-big-icon { font-size: 2.2rem; line-height: 1; flex-shrink: 0; }
    .class-role { font-size: .72rem; color: #6a6a8a; margin: .15rem 0; }

    .stats-bar-row { display: flex; flex-direction: column; gap: .3rem; margin: .6rem 0; }
    .stat-bar-item { display: flex; align-items: center; gap: .4rem; }
    .sbi-label { font-size: .65rem; color: #6a6a8a; width: 22px; flex-shrink: 0; font-weight: 700; }
    .sbi-track { flex: 1; height: 6px; background: #1a1a2e; border-radius: 3px; overflow: hidden; }
    .sbi-fill { height: 100%; border-radius: 3px; transition: width .4s ease; }
    .sbi-val { font-size: .7rem; color: #a8a8c8; width: 14px; text-align: right; }
    .class-playstyle { font-size: .72rem; color: #5a6a7a; font-style: italic; margin: .3rem 0 0; }

    /* ── VANTAGENS/DESVANTAGENS ── */
    .vd-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .vd-col-title { font-size: .95rem; font-weight: 700; color: #c9a84c; margin-bottom: .7rem;
      padding-bottom: .4rem; border-bottom: 1px solid #1e1e30; }
    .desv-limit { font-size: .68rem; color: #8a6a5a; font-weight: 400; }
    .vd-category { margin-bottom: 1.1rem; }
    .vd-cat-label { font-size: .67rem; color: #6a6a8a; text-transform: uppercase;
      letter-spacing: .08em; margin-bottom: .35rem; }

    .vd-item {
      background: #0c0c1a; border: 1px solid #1e1e30; border-radius: 7px;
      padding: .55rem .75rem; margin-bottom: .35rem; cursor: pointer; transition: all .2s;
      &:hover:not(.disabled) { border-color: #5a5a8e; background: #10102a; }
      &.selected { border-color: #c9a84c; background: #16160a; }
      &.disabled { opacity: .4; cursor: not-allowed; }
      &.desv-item.selected { border-color: #e74c3c; background: #160a0a; }
    }

    .vdi-top { display: flex; align-items: center; gap: .45rem; margin-bottom: .2rem; }
    .vdi-icon { font-size: .95rem; }
    .vdi-name { flex: 1; font-size: .8rem; font-weight: 600; color: #e8d5b0; }
    .vdi-cost { font-size: .7rem; font-weight: 700; padding: .1rem .3rem; border-radius: 4px;
      background: #0a160a; border: 1px solid #1e3a1e; color: #7ecf7e;
      &.refund { background: #160a0a; border-color: #3a1e1e; color: #cf7e7e; }
    }
    .vdi-effect { font-size: .7rem; color: #6a6a8a; margin: 0; padding-left: 1.4rem; }
    .desv-effect { color: #8a5a5a; }

    /* ── FOOTER ── */
    .creation-footer {
      display: flex; justify-content: space-between; align-items: center;
      padding: .7rem 1.5rem; border-top: 1px solid #1e1e30;
      background: #0a0a18; flex-shrink: 0;
    }

    .btn-prev { background: none; border: 1px solid #2e2e50; color: #8a7a5a;
      padding: .5rem 1.2rem; border-radius: 6px; cursor: pointer; font-size: .88rem;
      transition: all .2s; &:hover { border-color: #c9a84c; color: #c9a84c; } }

    .btn-next { background: linear-gradient(135deg, #c9a84c, #9a7830); border: none;
      color: #08080f; font-weight: 700; padding: .55rem 1.8rem; border-radius: 6px;
      cursor: pointer; font-size: .92rem; transition: all .2s;
      &:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
      &:disabled { opacity: .4; cursor: not-allowed; transform: none; } }

    .btn-confirm { background: linear-gradient(135deg, #7a0000, #c0392b);
      border: 2px solid #e74c3c; color: #fff; font-weight: 800;
      padding: .6rem 2rem; border-radius: 6px; cursor: pointer; font-size: .95rem;
      letter-spacing: .03em; transition: all .2s;
      &:hover:not(:disabled) { box-shadow: 0 0 20px rgba(231,76,60,.4); transform: translateY(-1px); }
      &:disabled { opacity: .4; cursor: not-allowed; transform: none; } }
  `]
})
export class CharacterCreationComponent {
  gameState = inject(GameStateService);
  gameData  = inject(GameDataService);

  vantagens    = VANTAGENS;
  desvantagens = DESVANTAGENS;
  categories   = VANTAGEM_CATEGORIES;
  steps        = [{ n: 1, label: 'Raça' }, { n: 2, label: 'Classe' }, { n: 3, label: 'Vantagens' }];

  step               = signal(1);
  charName           = 'Aventureiro';
  selectedRace       = signal<Race | null>(null);
  selectedClass      = signal<ClassDef | null>(null);
  selectedVantagens  = signal<string[]>([]);
  selectedDesvantagens = signal<string[]>([]);
  raceDiffFilter     = signal('Todas');
  classDiffFilter    = signal('Todas');

  filteredRaces = computed(() => {
    const f = this.raceDiffFilter();
    return f === 'Todas' ? this.gameData.races : this.gameData.races.filter(r => r.difficulty === f);
  });

  filteredClasses = computed(() => {
    const f = this.classDiffFilter();
    return f === 'Todas' ? this.gameData.classes : this.gameData.classes.filter(c => c.difficulty === f);
  });

  finalStats = computed(() => {
    const r = this.selectedRace();
    const c = this.selectedClass();
    if (!r || !c) return { forca: 1, habilidade: 1, resistencia: 1, armadura: 0, pontosMagia: 0, pontosVida: 10, bonusPoints: 0 };
    return this.gameData.calculateFinalStats(r.id, c.id);
  });

  statRows = computed(() => {
    const s = this.finalStats();
    return [
      { label: 'Força',      value: s.forca,      color: '#e74c3c' },
      { label: 'Habilidade', value: s.habilidade,  color: '#3498db' },
      { label: 'Resistência',value: s.resistencia, color: '#27ae60' },
      { label: 'Armadura',   value: s.armadura,    color: '#95a5a6' },
    ];
  });

  totalPoints = computed(() => {
    const base = this.gameData.availablePoints(this.selectedRace()?.id ?? 'humano');
    const desvRefund = this.selectedDesvantagens()
      .reduce((s, id) => s + (DESVANTAGENS.find(d => d.id === id)?.refund ?? 0), 0);
    return base + desvRefund;
  });

  spentPoints = computed(() =>
    this.selectedVantagens()
      .reduce((s, id) => s + (VANTAGENS.find(v => v.id === id)?.cost ?? 0), 0)
  );

  pointsLeft = computed(() => this.totalPoints() - this.spentPoints());

  allFreeVantagens = computed(() => {
    const list: string[] = [];
    this.selectedRace()?.freeVantagens.forEach(v => list.push(v.name));
    this.selectedClass()?.freeVantagens.forEach(v => list.push(v.name));
    return list;
  });

  selectedVantagensNames = computed(() =>
    this.selectedVantagens().map(id => VANTAGENS.find(v => v.id === id)?.name ?? id)
  );

  classStatBars(cls: ClassDef): { label: string; value: number; pct: number }[] {
    const maxF = 4;
    return [
      { label: 'F', value: cls.baseStats.forca,       pct: (cls.baseStats.forca / maxF) * 100 },
      { label: 'H', value: cls.baseStats.habilidade,  pct: (cls.baseStats.habilidade / maxF) * 100 },
      { label: 'R', value: cls.baseStats.resistencia, pct: (cls.baseStats.resistencia / maxF) * 100 },
      { label: 'A', value: cls.baseStats.armadura,    pct: (cls.baseStats.armadura / maxF) * 100 },
    ];
  }

  vantagensByCategory(cat: string): VantagemDef[] {
    return VANTAGENS.filter(v => v.category === cat);
  }

  diffColor(d: string): string { return DIFFICULTY_COLORS[d] ?? '#888'; }

  isVantagemSelected(id: string) { return this.selectedVantagens().includes(id); }
  isDesvSelected(id: string)     { return this.selectedDesvantagens().includes(id); }
  getDesv(id: string)            { return DESVANTAGENS.find(d => d.id === id); }

  canSelectVantagem(v: VantagemDef): boolean {
    if (this.isVantagemSelected(v.id)) return true;
    if (this.pointsLeft() < v.cost) return false;
    return !(v.incompatibleWith ?? []).some(id => this.isVantagemSelected(id));
  }

  canSelectDesv(d: DesvantagemDef): boolean {
    return this.isDesvSelected(d.id) || this.selectedDesvantagens().length < 2;
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

  selectRace(r: Race)   { this.selectedRace.set(r); }
  selectClass(c: ClassDef) { this.selectedClass.set(c); }
  goToStep(n: number)   { this.step.set(n); }

  canAdvance(): boolean {
    if (this.step() === 1) return !!this.selectedRace();
    if (this.step() === 2) return !!this.selectedClass();
    return true;
  }

  canConfirm(): boolean {
    return !!this.selectedRace() && !!this.selectedClass()
      && this.pointsLeft() >= 0 && this.charName.trim().length > 0;
  }

  nextStep() { if (this.canAdvance()) this.step.update(s => s + 1); }
  prevStep() { this.step.update(s => s - 1); }

  pip(val: number, max: number): boolean[] {
    return Array.from({ length: max }, (_, i) => i < val);
  }

  confirm() {
    if (!this.canConfirm()) return;
    const stats = this.finalStats();

    const character: Character = {
      id: crypto.randomUUID(),
      name: this.charName.trim() || 'Aventureiro',
      class: this.selectedClass()!.id,
      race:  this.selectedRace()!.id,
      level: 1, xp: 0, xpToNextLevel: 100,
      forca:       { base: stats.forca,       current: stats.forca,       max: stats.forca },
      habilidade:  { base: stats.habilidade,  current: stats.habilidade,  max: stats.habilidade },
      resistencia: { base: stats.resistencia, current: stats.resistencia, max: stats.resistencia },
      armadura: stats.armadura,
      pontosMagia:  { base: stats.pontosMagia,  current: stats.pontosMagia,  max: stats.pontosMagia },
      pontosVida:   { base: stats.pontosVida,   current: stats.pontosVida,   max: stats.pontosVida },
      vantagens: [...this.allFreeVantagens(), ...this.selectedVantagensNames()],
      desvantagens: this.selectedDesvantagens().map(id => this.getDesv(id)!.name),
      gold: 20, items: ['Poção de Cura'], statusEffects: []
    };

    this.gameState.startCustomGame(character);
  }
}
