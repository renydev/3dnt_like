import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { Character, CLASS_ICONS, CLASS_COLORS } from '../../../core/models/character.model';

@Component({
  selector: 'app-party-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './party-bar.component.html',
  styleUrl: './party-bar.component.scss',
})
export class PartyBarComponent {
  gs = inject(GameStateService);
  openDialog = output<Character>();
  compact = input(false);

  emptySlots(): number[] {
    const filled = this.gs.companions().length;
    return Array.from({ length: Math.max(0, 3 - filled) }, (_, i) => i);
  }

  pct(current: number, max: number): number {
    return max > 0 ? Math.round((current / max) * 100) : 0;
  }

  classIcon(char: Character): string {
    return CLASS_ICONS[char.class] ?? '⚔️';
  }

  classColor(char: Character): string {
    return CLASS_COLORS[char.class] ?? '#888';
  }

  toRoman(n: number): string {
    const vals = [10,9,5,4,1];
    const syms = ['X','IX','V','IV','I'];
    let result = '';
    for (let i = 0; i < vals.length; i++) {
      while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
    }
    return result;
  }
}
