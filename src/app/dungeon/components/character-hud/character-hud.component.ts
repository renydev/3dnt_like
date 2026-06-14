import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { CLASS_ICONS } from '../../../core/models/character.model';

@Component({
  selector: 'app-character-hud',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (char()) {
      <div class="hud">
        <div class="hud-portrait">
          <span class="class-icon">{{ classIcon() }}</span>
        </div>
        <div class="hud-info">
          <div class="char-name">{{ char()!.name }}</div>
          <div class="char-sub">{{ char()!.race }} {{ char()!.class }} • Nv {{ char()!.level }}</div>

          <div class="bars">
            <div class="bar-group">
              <span class="bar-label">PV</span>
              <div class="bar-track">
                <div class="bar-fill pv-bar" [style.width.%]="pvPercent()"></div>
              </div>
              <span class="bar-value">{{ char()!.pontosVida.current }}/{{ char()!.pontosVida.max }}</span>
            </div>
            @if (char()!.pontosMana.max > 0) {
              <div class="bar-group">
                <span class="bar-label">PM</span>
                <div class="bar-track">
                  <div class="bar-fill pm-bar" [style.width.%]="pmPercent()"></div>
                </div>
                <span class="bar-value">{{ char()!.pontosMana.current }}/{{ char()!.pontosMana.max }}</span>
              </div>
            }
          </div>
        </div>
        <div class="hud-stats">
          <div class="stat"><span class="stat-label">F</span><span class="stat-val">{{ char()!.forca.current }}</span></div>
          <div class="stat"><span class="stat-label">H</span><span class="stat-val">{{ char()!.habilidade.current }}</span></div>
          <div class="stat"><span class="stat-label">R</span><span class="stat-val">{{ char()!.resistencia.current }}</span></div>
          <div class="stat"><span class="stat-label">A</span><span class="stat-val">{{ char()!.armadura }}</span></div>
          <div class="stat"><span class="stat-label">PF</span><span class="stat-val">{{ char()!.poderFogo.current }}</span></div>
          <div class="stat gold"><span class="stat-label">💰</span><span class="stat-val">{{ char()!.gold }}</span></div>
        </div>
      </div>
    }
  `,
  styles: [`
    .hud {
      display: flex;
      gap: 0.75rem;
      align-items: center;
      padding: 0.75rem 1rem;
      background: rgba(0,0,0,0.5);
      border: 1px solid var(--color-border);
      border-radius: 6px;
    }
    .hud-portrait {
      width: 48px; height: 48px;
      border-radius: 50%;
      border: 2px solid var(--color-gold);
      background: rgba(212,170,20,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.6rem;
      flex-shrink: 0;
    }
    .hud-info { flex: 1; min-width: 0; }
    .char-name {
      font-family: var(--font-display);
      color: var(--color-gold);
      font-size: 0.95rem;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .char-sub { font-size: 0.7rem; color: var(--color-text-muted); text-transform: capitalize; margin-bottom: 0.4rem; }
    .bars { display: flex; flex-direction: column; gap: 4px; }
    .bar-group { display: flex; align-items: center; gap: 6px; }
    .bar-label { font-size: 0.65rem; color: var(--color-text-muted); width: 16px; text-align: right; }
    .bar-track {
      flex: 1; height: 8px; background: #1a1a1a;
      border-radius: 4px; border: 1px solid #333; overflow: hidden;
    }
    .bar-fill {
      height: 100%; border-radius: 4px;
      transition: width 0.4s ease;
    }
    .pv-bar { background: linear-gradient(90deg, #7a0000, #e74c3c); }
    .pm-bar { background: linear-gradient(90deg, #1a0050, #8e44ad); }
    .bar-value { font-size: 0.65rem; color: var(--color-text); width: 36px; text-align: right; }
    .hud-stats {
      display: flex; flex-direction: column; gap: 3px;
      border-left: 1px solid var(--color-border); padding-left: 0.75rem;
    }
    .stat { display: flex; gap: 4px; align-items: center; }
    .stat-label { font-size: 0.65rem; color: var(--color-text-muted); width: 14px; }
    .stat-val { font-family: var(--font-display); color: var(--color-amber); font-size: 0.8rem; }
    .stat.gold .stat-val { color: var(--color-gold); }
  `]
})
export class CharacterHudComponent {
  private gameState = inject(GameStateService);
  char = this.gameState.character;

  classIcon = computed(() => {
    const c = this.char();
    return c ? CLASS_ICONS[c.class] : '';
  });

  pvPercent = computed(() => {
    const c = this.char();
    return c ? (c.pontosVida.current / c.pontosVida.max) * 100 : 0;
  });

  pmPercent = computed(() => {
    const c = this.char();
    return c ? (c.pontosMana.current / c.pontosMana.max) * 100 : 0;
  });
}
