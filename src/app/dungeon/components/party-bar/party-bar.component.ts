import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { Character, DEFAULT_CHAR_COLOR } from '../../../core/models/character.model';
import { KIT_MAP } from '../../../core/data/kits.data';

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
    return KIT_MAP.get(char.kits[0])?.icon ?? char.portraitIcon ?? '⚔️';
  }

  classColor(char: Character): string {
    return DEFAULT_CHAR_COLOR;
  }

  kitNames(char: Character): string {
    return char.kits.map(id => KIT_MAP.get(id)?.name ?? id).join(', ');
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
