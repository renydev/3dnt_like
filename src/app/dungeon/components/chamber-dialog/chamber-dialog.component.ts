import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { RoomChoice } from '../../../core/models/dungeon.model';

@Component({
  selector: 'app-chamber-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (room()) {
      <div class="chamber-overlay" (click)="onOverlayClick($event)">
        <div class="chamber-dialog">
          <div class="chamber-header">
            <h2 class="chamber-name">{{ room()!.name }}</h2>
          </div>

          <div class="chamber-body">
            <p class="chamber-description">{{ description() }}</p>
          </div>

          <div class="chamber-choices">
            @for (choice of visibleChoices(); track choice.label) {
              <button
                class="choice-btn"
                [class.choice-flee]="choice.action === 'flee'"
                [class.choice-safe]="choice.action === 'safe_enter'"
                [class.choice-rest]="choice.action === 'rest_wait'"
                [title]="choice.description ?? ''"
                (click)="choose(choice)"
              >
                {{ choice.label }}
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .chamber-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 1rem;
    }

    .chamber-dialog {
      background: var(--surface, #1a1a2e);
      border: 1px solid var(--border, #3a3a5c);
      border-radius: 12px;
      max-width: 560px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,.6);
      overflow: hidden;
    }

    .chamber-header {
      padding: 1.25rem 1.5rem 1rem;
      border-bottom: 1px solid var(--border, #3a3a5c);
    }

    .chamber-name {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--accent, #c9a84c);
      letter-spacing: .02em;
    }

    .chamber-body {
      padding: 1.25rem 1.5rem;
    }

    .chamber-description {
      margin: 0;
      font-size: .9rem;
      line-height: 1.65;
      color: var(--text-secondary, #b0b0cc);
      white-space: pre-wrap;
    }

    .chamber-choices {
      padding: .75rem 1.5rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }

    .choice-btn {
      padding: .65rem 1rem;
      border-radius: 8px;
      border: 1px solid var(--border, #3a3a5c);
      background: var(--surface-raised, #252540);
      color: var(--text, #e0e0f0);
      font-size: .9rem;
      cursor: pointer;
      text-align: left;
      transition: background .15s, border-color .15s;
    }

    .choice-btn:hover {
      background: var(--surface-hover, #2e2e50);
      border-color: var(--accent, #c9a84c);
      color: var(--accent, #c9a84c);
    }

    .choice-flee {
      border-color: var(--danger-muted, #5c3a3a);
      color: var(--text-muted, #888);
    }

    .choice-flee:hover {
      border-color: var(--danger, #c94c4c);
      color: var(--danger, #c94c4c);
      background: var(--surface-raised, #252540);
    }

    .choice-safe {
      border-color: var(--success-muted, #3a5c3a);
    }

    .choice-safe:hover {
      border-color: var(--success, #4caf50);
      color: var(--success, #4caf50);
    }

    .choice-rest {
      border-color: var(--info-muted, #3a4c5c);
    }

    .choice-rest:hover {
      border-color: var(--info, #4c9fc9);
      color: var(--info, #4c9fc9);
    }
  `],
})
export class ChamberDialogComponent {
  private gs = inject(GameStateService);

  room = computed(() => {
    const roomId = this.gs.pendingRoomEntry();
    if (roomId === null) return null;
    return this.gs.currentFloor()?.rooms.find(r => r.id === roomId) ?? null;
  });

  description = computed(() => {
    const r = this.room();
    return r?.scenario?.description ?? r?.description ?? '';
  });

  visibleChoices = computed((): RoomChoice[] => {
    const r = this.room();
    if (!r) return [];

    const choices = r.scenario?.choices;
    if (!choices || choices.length === 0) {
      return [
        { label: 'Entrar', action: 'enter' },
        { label: 'Desistir de entrar', action: 'flee' },
      ];
    }

    const partyPericias = this._partyPericias();
    return choices.filter(c =>
      !c.requiresPericia || partyPericias.has(c.requiresPericia)
    );
  });

  choose(choice: RoomChoice): void {
    this.gs.confirmRoomEntry(choice);
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('chamber-overlay')) {
      this.gs.pendingRoomEntry.set(null);
    }
  }

  private _partyPericias(): Set<string> {
    const all = new Set<string>();
    for (const member of this.gs.party()) {
      for (const p of member.pericias ?? []) all.add(p);
    }
    return all;
  }
}
