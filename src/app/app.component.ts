import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from './core/services/game-state.service';
import { DungeonMapComponent } from './dungeon/components/dungeon-map.component';
import { CharacterHudComponent } from './dungeon/components/character-hud.component';
import { EncounterScreenComponent } from './dungeon/components/encounter-screen.component';
import { FloorProgressComponent } from './dungeon/components/floor-progress.component';
import { CharacterCreationComponent } from './dungeon/components/character-creation.component';
import { PRESET_CHARACTERS, CLASS_ICONS } from './core/models/character.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DungeonMapComponent, CharacterHudComponent, EncounterScreenComponent, FloorProgressComponent, CharacterCreationComponent],
  template: `
    <div class="game-wrapper">

      <!-- MENU PRINCIPAL -->
      @if (gameState.screen() === 'menu') {
        <div class="screen menu-screen">
          <div class="menu-bg-runes">
            @for (r of runes; track $index) {
              <span class="bg-rune" [style.left.%]="r.x" [style.top.%]="r.y" [style.font-size.rem]="r.size">{{ r.char }}</span>
            }
          </div>
          <div class="menu-content">
            <div class="menu-logo">
              <div class="logo-subtitle">Masmorras de</div>
              <h1 class="logo-title">VALKARIA</h1>
              <div class="logo-edition">Roguelike • Sistema 3D&T</div>
            </div>
            <div class="menu-buttons">
              <button class="btn-menu-primary" (click)="gameState.screen.set('character_create')">
                ⚔️ Nova Aventura
              </button>
              <button class="btn-menu-secondary" disabled>
                📜 Continuar (em breve)
              </button>
              <button class="btn-menu-secondary" disabled>
                🏆 Recordes (em breve)
              </button>
            </div>
            <p class="menu-credit">Fan-game baseado em Valkaria (Tormenta RPG / Jambô) • Sistema 3D&T</p>
          </div>
        </div>
      }

      <!-- CRIAÇÃO DE PERSONAGEM -->
      @if (gameState.screen() === 'character_create') {
        <div class="screen">
          <app-character-creation />
        </div>
      }

      <!-- DUNGEON / MAPA -->
      @if (gameState.screen() === 'dungeon' || gameState.screen() === 'encounter') {
        <div class="screen game-screen">
          <div class="game-layout">
            <div class="game-left">
              <app-character-hud />
              <app-floor-progress />
              @if (gameState.screen() === 'dungeon') {
                <app-dungeon-map />
              } @else {
                <app-encounter-screen />
              }
            </div>
            <div class="game-right">
              <div class="log-panel">
                <div class="log-title">📜 Diário de Aventura</div>
                <div class="log-entries">
                  @for (entry of gameState.log(); track $index) {
                    <div class="log-entry">{{ entry }}</div>
                  }
                </div>
              </div>
              <button class="btn-menu-back" (click)="gameState.goToMenu()">🏠 Menu</button>
            </div>
          </div>
        </div>
      }

      <!-- GAME OVER -->
      @if (gameState.screen() === 'game_over') {
        <div class="screen overlay-screen">
          <div class="overlay-content">
            <div class="overlay-icon">💀</div>
            <h2>O Herói Caiu</h2>
            <p>As sombras de Valkaria reclamaram mais uma alma...</p>
            <p class="floor-reached">Chegou ao Andar {{ gameState.floorNumber() }}</p>
            <button class="btn-menu-primary" (click)="gameState.screen.set('character_create')">⚔️ Tentar Novamente</button>
            <button class="btn-menu-secondary" (click)="gameState.goToMenu()">🏠 Menu Principal</button>
          </div>
        </div>
      }

      <!-- VITÓRIA -->
      @if (gameState.screen() === 'victory') {
        <div class="screen overlay-screen victory">
          <div class="overlay-content">
            <div class="overlay-icon">🏆</div>
            <h2>Valkaria Conquistada!</h2>
            <p>As trevas foram dissipadas. O herói se torna lenda!</p>
            <button class="btn-menu-primary" (click)="gameState.screen.set('character_create')">⚔️ Jogar Novamente</button>
            <button class="btn-menu-secondary" (click)="gameState.goToMenu()">🏠 Menu Principal</button>
          </div>
        </div>
      }

    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  gameState = inject(GameStateService);
  presets = PRESET_CHARACTERS;

  runes = Array.from({ length: 18 }, () => ({
    char: '᚛᚜ᚁᚂᚃᚄᚅᚆᚇᚈᚉᚊᚋᚌᚍᚎᚏᚐᚑᚒᚓᚔᚕᚖᚗᚘᚙᚚ'[Math.floor(Math.random() * 30)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 3
  }));

  getClassIcon(cls: string): string {
    return CLASS_ICONS[cls as keyof typeof CLASS_ICONS] ?? '⚔️';
  }
}
