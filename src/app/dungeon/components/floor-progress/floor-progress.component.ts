import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { VALKARIA_FLOORS } from '../../../core/models/dungeon.model';

@Component({
  selector: 'app-floor-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="floor-progress-panel">
      <div class="progress-title">
        <span>📜 Labirinto de Valkaria</span>
        <span class="floor-count">{{ gameState.floorNumber() }}/{{ gameState.TOTAL_FLOORS }}</span>
      </div>
      <div class="floors-grid">
        @for (floor of floors; track floor.floorNumber) {
          <div
            class="floor-pip"
            [class.done]="floor.floorNumber < gameState.floorNumber()"
            [class.current]="floor.floorNumber === gameState.floorNumber()"
            [class.locked]="floor.floorNumber > gameState.floorNumber()"
            [title]="floor.floorNumber + '. ' + floor.godName + ' — ' + floor.name"
          >
            <span class="pip-icon">{{ floor.icon }}</span>
            <span class="pip-num">{{ floor.floorNumber }}</span>
          </div>
        }
      </div>
      <div class="progress-bar-wrap">
        <div class="progress-bar-fill" [style.width.%]="gameState.progressPercent()"></div>
      </div>
    </div>
  `,
  styles: [`
    .floor-progress-panel {
      padding: 0.6rem 0.75rem;
      background: rgba(0,0,0,0.4);
      border: 1px solid var(--color-border);
      border-radius: 6px;
    }
    .progress-title {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.7rem; color: var(--color-text-muted);
      font-family: var(--font-display); letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
      .floor-count { color: var(--color-amber); font-size: 0.85rem; }
    }
    .floors-grid {
      display: grid; grid-template-columns: repeat(10, 1fr);
      gap: 3px; margin-bottom: 0.5rem;
    }
    .floor-pip {
      display: flex; flex-direction: column; align-items: center;
      padding: 3px 2px; border-radius: 3px; cursor: default;
      border: 1px solid transparent; transition: all 0.2s ease;
      .pip-icon { font-size: 0.7rem; line-height: 1; }
      .pip-num { font-size: 0.5rem; color: var(--color-text-muted); line-height: 1; }
      &.done {
        border-color: rgba(39,174,96,0.4); background: rgba(39,174,96,0.1);
        .pip-num { color: #27ae60; }
      }
      &.current {
        border-color: var(--color-gold); background: rgba(212,170,20,0.15);
        box-shadow: 0 0 6px var(--color-gold-glow);
        .pip-num { color: var(--color-gold); }
        animation: currentPulse 2s ease-in-out infinite;
      }
      &.locked { opacity: 0.25; }
    }
    .progress-bar-wrap {
      height: 3px; background: #1a1a1a; border-radius: 2px; overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%; background: linear-gradient(90deg, #27ae60, var(--color-gold));
      border-radius: 2px; transition: width 0.5s ease;
    }
    @keyframes currentPulse {
      0%, 100% { box-shadow: 0 0 6px var(--color-gold-glow); }
      50% { box-shadow: 0 0 12px var(--color-gold-glow); }
    }
  `]
})
export class FloorProgressComponent {
  gameState = inject(GameStateService);
  floors = VALKARIA_FLOORS;
}
