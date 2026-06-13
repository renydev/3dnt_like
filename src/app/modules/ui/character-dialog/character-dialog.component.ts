import { Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { Character, CLASS_COLORS, CLASS_ICONS } from '../../../core/models/character.model';

export type SpendableAttr = 'forca' | 'habilidade' | 'resistencia' | 'armadura' | 'pontosMagia';

export interface AttrRow {
  key: SpendableAttr;
  label: string;
  icon: string;
  value: (c: Character) => number;
  max?: (c: Character) => number;
}

export const ATTR_ROWS: AttrRow[] = [
  { key: 'forca',       label: 'Força',           icon: '⚔️', value: c => c.forca.current,       max: c => c.forca.max },
  { key: 'habilidade',  label: 'Habilidade',      icon: '🎯', value: c => c.habilidade.current,  max: c => c.habilidade.max },
  { key: 'resistencia', label: 'Resistência',     icon: '🛡️', value: c => c.resistencia.current, max: c => c.resistencia.max },
  { key: 'armadura',    label: 'Armadura',        icon: '🔰', value: c => c.armadura },
  { key: 'pontosMagia', label: 'Pontos de Magia', icon: '✨', value: c => c.pontosMagia.current, max: c => c.pontosMagia.max },
];

@Component({
  selector: 'app-character-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './character-dialog.component.html',
  styleUrl: './character-dialog.component.scss',
})
export class CharacterDialogComponent {
  char = input.required<Character | null>();
  close = output<void>();

  gs = inject(GameStateService);
  attrRows = ATTR_ROWS;

  classColor(): string {
    return CLASS_COLORS[this.char()!.class] ?? '#888';
  }

  classIcon(): string {
    return CLASS_ICONS[this.char()!.class] ?? '⚔️';
  }

  xpPct(): number {
    const c = this.char()!;
    return c.xpToNextLevel > 0 ? Math.round((c.xp / c.xpToNextLevel) * 100) : 0;
  }

  hpPct(): number {
    const c = this.char()!;
    return c.pontosVida.max > 0 ? Math.round((c.pontosVida.current / c.pontosVida.max) * 100) : 0;
  }

  pmPct(): number {
    const c = this.char()!;
    return c.pontosMagia.max > 0 ? Math.round((c.pontosMagia.current / c.pontosMagia.max) * 100) : 0;
  }

  attrPct(row: AttrRow): number {
    const c = this.char()!;
    const val = row.value(c);
    const max = row.max ? row.max(c) : val;
    return max > 0 ? Math.round((val / Math.max(max, val)) * 100) : 0;
  }

  spend(attr: SpendableAttr): void {
    const c = this.char()!;
    if (!c.levelUpPoints) return;
    if (c.isCompanion) {
      this.gs.spendCompanionLevelUpPoint(c.id, attr);
    } else {
      this.gs.spendLevelUpPoint(attr);
    }
  }

  onBackdrop(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('dialog-backdrop')) {
      this.close.emit();
    }
  }
}
