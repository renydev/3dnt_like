import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { Character } from '../../../core/models/character.model';
import { KIT_MAP } from '../../../core/data/kits.data';

@Component({
  selector: 'app-companion-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './companion-select.component.html',
  styleUrl: './companion-select.component.scss',
})
export class CompanionSelectComponent {
  gs = inject(GameStateService);

  select(choice: Omit<Character, 'id'>): void {
    this.gs.selectCompanion(choice);
  }

  statLabel(val: { current: number; max: number }): string {
    return `${val.current}`;
  }

  kitNames(kitIds: string[]): string {
    return kitIds.map(id => KIT_MAP.get(id)?.name ?? id).join(', ');
  }
}
