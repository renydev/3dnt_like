import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { VALKARIA_FLOORS } from '../../../core/models/dungeon.model';

@Component({
  selector: 'app-floor-transition',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floor-transition.component.html',
  styleUrl: './floor-transition.component.scss',
})
export class FloorTransitionComponent implements OnInit {
  gs = inject(GameStateService);

  floors = Array.from({ length: 20 }, (_, i) => i + 1);
  ready = signal(false);

  ngOnInit(): void {
    setTimeout(() => this.ready.set(true), 200);
  }

  prevTheme() {
    const idx = Math.max(0, this.gs.floorNumber() - 2);
    return VALKARIA_FLOORS[idx] ?? null;
  }

  isSimpleRule(): boolean {
    return this.gs.nextTheme()?.specialRule?.includes('Masmorra mais simples') ?? false;
  }

  flavorText(): string {
    const texts = this.gs.nextTheme()?.flavorTexts ?? [];
    return texts[0] ?? 'As profundezas aguardam...';
  }

  nextPaletteColor(): string {
    const palette = this.gs.nextTheme()?.palette ?? 'default';
    const map: Record<string, string> = {
      forest: '#27ae60', war: '#c0392b', ocean: '#2980b9',
      fire: '#e67e22', shadow: '#8e44ad', ice: '#74b9ff',
      gold: '#f39c12', chaos: '#9b59b6', divine: '#f1c40f',
      death: '#636e72', arcane: '#6c5ce7', nature: '#55efc4',
    };
    return map[palette] ?? '#d4aa14';
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

  proceed(): void {
    this.gs.proceedToNextFloor();
  }
}
