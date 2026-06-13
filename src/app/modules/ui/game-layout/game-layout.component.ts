import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { Character } from '../../../core/models/character.model';

import { PartyBarComponent } from '../party-bar/party-bar.component';
import { CharacterDialogComponent } from '../character-dialog/character-dialog.component';
import { FloorTransitionComponent } from '../floor-transition/floor-transition.component';
import { DungeonMapComponent } from '../../../dungeon/components/dungeon-map.component';
import { EncounterScreenComponent } from '../../../dungeon/components/encounter-screen.component';

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
  ],
  templateUrl: './game-layout.component.html',
  styleUrl: './game-layout.component.scss',
})
export class GameLayoutComponent {
  gs = inject(GameStateService);
  dialogChar = signal<Character | null>(null);

  openCharDialog(char: Character): void {
    this.dialogChar.set(char);
  }

  closeCharDialog(): void {
    this.dialogChar.set(null);
  }
}
