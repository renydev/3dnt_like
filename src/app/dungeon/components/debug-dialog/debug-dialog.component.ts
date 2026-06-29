import { Component, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';

@Component({
  selector: 'app-debug-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="debug-backdrop" (click)="onBackdrop($event)">
      <div class="debug-box" (click)="$event.stopPropagation()">

        <div class="debug-header">
          <span class="debug-icon">🛠️</span>
          <h2 class="debug-title">Debug — Teleporte de Masmorra</h2>
          <button class="debug-close" (click)="close.emit()">✕</button>
        </div>

        <p class="debug-hint">Selecione um andar para ir diretamente. O personagem atual é mantido.</p>

        <div class="floor-grid">
          @for (theme of floors(); track theme.floorNumber) {
            <button
              class="floor-btn"
              [class.active]="gs.floorNumber() === theme.floorNumber"
              (click)="jump(theme.floorNumber)"
            >
              <span class="fb-icon">{{ theme.icon }}</span>
              <span class="fb-num">{{ theme.floorNumber }}</span>
              <span class="fb-god">{{ theme.godName }}</span>
              <span class="fb-name">{{ theme.name }}</span>
            </button>
          }
        </div>

        <div class="debug-footer">
          <span class="shortcut-hint">Ctrl+Shift+F2 para fechar</span>
          <button class="btn-heal" (click)="fullHeal()">💉 Full Heal</button>
          <button class="btn-xp" (click)="addXp()">⭐ +50 XP</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .debug-backdrop {
      position: fixed; inset: 0; z-index: 9000;
      background: rgba(0,0,0,0.8);
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.12s ease;
    }

    .debug-box {
      background: #0e0e1a;
      border: 1px solid #3a3a6a;
      border-radius: 10px;
      width: min(820px, 96vw);
      max-height: 90vh;
      overflow-y: auto;
      display: flex; flex-direction: column; gap: 0.8rem;
      padding: 1.1rem;
      box-shadow: 0 0 60px rgba(100,100,255,0.15);
      animation: slideUp 0.18s ease;
    }

    .debug-header {
      display: flex; align-items: center; gap: 0.6rem;
    }
    .debug-icon { font-size: 1.3rem; }
    .debug-title {
      flex: 1; margin: 0;
      font-family: var(--font-display);
      font-size: 1rem;
      color: #8080ff;
    }
    .debug-close {
      background: transparent; border: 1px solid #2a2a4a;
      color: #666; width: 26px; height: 26px; border-radius: 50%;
      cursor: pointer; font-size: 0.75rem;
      transition: all 0.15s;
      &:hover { border-color: #8080ff; color: #8080ff; }
    }

    .debug-hint {
      margin: 0; font-size: 0.72rem;
      color: #4a4a7a; font-style: italic;
    }

    .floor-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 6px;
    }

    .floor-btn {
      display: grid;
      grid-template-columns: 1.6rem 1.4rem 1fr;
      grid-template-rows: auto auto;
      gap: 0 4px;
      padding: 0.45rem 0.6rem;
      background: #0a0a18;
      border: 1px solid #1a1a30;
      border-radius: 6px;
      cursor: pointer; text-align: left;
      transition: all 0.15s;
      color: var(--color-text);

      &:hover {
        border-color: #5050aa;
        background: #10102a;
        box-shadow: 0 0 8px rgba(80,80,170,0.2);
      }

      &.active {
        border-color: #8080ff;
        background: #12123a;
        box-shadow: 0 0 12px rgba(128,128,255,0.25);
      }
    }

    .fb-icon {
      grid-row: 1 / 3; grid-column: 1;
      font-size: 1.3rem; align-self: center;
    }
    .fb-num {
      grid-row: 1; grid-column: 2;
      font-family: var(--font-display); font-size: 0.65rem;
      color: #5050aa; align-self: end;
    }
    .fb-god {
      grid-row: 1; grid-column: 3;
      font-family: var(--font-display); font-size: 0.75rem;
      color: #8080ff; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .fb-name {
      grid-row: 2; grid-column: 2 / 4;
      font-size: 0.6rem; color: #4a4a6a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    .debug-footer {
      display: flex; align-items: center; gap: 0.5rem;
      border-top: 1px solid #1a1a30; padding-top: 0.6rem;
    }
    .shortcut-hint {
      flex: 1; font-size: 0.65rem; color: #2a2a4a; font-style: italic;
    }

    .btn-heal, .btn-xp {
      font-size: 0.72rem; padding: 4px 10px;
      border-radius: 4px; cursor: pointer;
      font-family: var(--font-display);
      transition: all 0.15s;
    }
    .btn-heal {
      background: rgba(46,204,113,0.1);
      border: 1px solid rgba(46,204,113,0.4);
      color: #2ecc71;
      &:hover { background: rgba(46,204,113,0.22); }
    }
    .btn-xp {
      background: rgba(128,128,255,0.1);
      border: 1px solid rgba(128,128,255,0.4);
      color: #8080ff;
      &:hover { background: rgba(128,128,255,0.22); }
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp {
      from { transform: translateY(16px); opacity: 0; }
      to   { transform: none; opacity: 1; }
    }
  `],
})
export class DebugDialogComponent {
  gs = inject(GameStateService);
  close = output<void>();

  floors = this.gs.campaign.floors;

  jump(floorNumber: number): void {
    this.gs.debugJumpToFloor(floorNumber);
    this.close.emit();
  }

  fullHeal(): void {
    this.gs.debugFullHeal();
  }

  addXp(): void {
    this.gs.addXp(50, 0);
  }

  onBackdrop(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('debug-backdrop')) {
      this.close.emit();
    }
  }
}
