import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { CombatService } from '../../../core/services/combat.service';
import { Character } from '../../../core/models/character.model';

import { PartyBarComponent } from '../party-bar/party-bar.component';
import { CharacterDialogComponent } from '../character-dialog/character-dialog.component';
import { FloorTransitionComponent } from '../floor-transition/floor-transition.component';
import { DungeonMapComponent } from '../../../dungeon/components/dungeon-map/dungeon-map.component';
import { EncounterScreenComponent } from '../../../dungeon/components/encounter-screen/encounter-screen.component';
import { DebugDialogComponent } from '../debug-dialog/debug-dialog.component';
import { ChamberDialogComponent } from '../chamber-dialog/chamber-dialog.component';

@Component({
  selector: 'app-game-layout',
  standalone: true,
  imports: [
    CommonModule,
    PartyBarComponent,
    CharacterDialogComponent,
    FloorTransitionComponent,
    DungeonMapComponent,
    EncounterScreenComponent,
    DebugDialogComponent,
    ChamberDialogComponent,
  ],
  templateUrl: './game-layout.component.html',
  styleUrl: './game-layout.component.scss',
})
export class GameLayoutComponent {
  gs = inject(GameStateService);
  combat = inject(CombatService);
  dialogChar = signal<Character | null>(null);
  debugOpen = signal(false);

  inCombat = () => this.gs.screen() === 'encounter';

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (e.ctrlKey && e.shiftKey && e.key === 'F2') {
      e.preventDefault();
      // Só abre se já há personagem em jogo
      if (this.gs.character()) this.debugOpen.update(v => !v);
    }
  }

  openCharDialog(char: Character): void { this.dialogChar.set(char); }
  closeCharDialog(): void { this.dialogChar.set(null); }

  phaseLabel(): string {
    const map: Record<string, string> = {
      player_turn: '▶ Seu turno',
      enemy_turn:  '⚡ Inimigos',
      victory:     '🏆 Vitória',
      defeat:      '💀 Derrota',
    };
    return map[this.combat.phase()] ?? '';
  }

  hpPct(e: { hp: number; maxHp: number }): number {
    return Math.max(0, Math.round(e.hp / e.maxHp * 100));
  }
}
