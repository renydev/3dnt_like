import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { GameStateService } from './core/services/game-state.service';
import { DebugComponent } from './debug/debug.component';
import { CharacterCreationComponent } from './dungeon/components/character-creation/character-creation.component';
import { GameLayoutComponent } from './dungeon/components/game-layout/game-layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GameLayoutComponent, CharacterCreationComponent, DebugComponent],
  template: `
    @if (isDebugMap) {
      <app-debug />
    } @else {
      <div class="game-wrapper">

        @if (gs.screen() === 'menu') {
          <div class="screen menu-screen">
            <div class="menu-bg-runes">
              @for (r of runes; track $index) {
                <span
                  class="bg-rune"
                  [style.left.%]="r.x"
                  [style.top.%]="r.y"
                  [style.font-size.rem]="r.size"
                >{{ r.char }}</span>
              }
            </div>

            <div class="menu-content">
              <div class="menu-logo">
                <div class="logo-subtitle">{{ texts().menuKicker }}</div>
                <h1 class="logo-title">{{ texts().menuTitle }}</h1>
                <div class="logo-edition">{{ texts().menuEdition }}</div>
              </div>

              <div class="menu-buttons">
                <div class="campaign-switch">
                  <button
                    class="btn-menu-secondary"
                    [class.active]="gs.campaign.activeCampaignId() === 'valkaria'"
                    (click)="gs.campaign.setCampaign('valkaria')"
                  >
                    Valkaria
                  </button>
                  <button
                    class="btn-menu-secondary"
                    [class.active]="gs.campaign.activeCampaignId() === 'unipotencia'"
                    (click)="gs.campaign.setCampaign('unipotencia')"
                  >
                    Unipotência
                  </button>
                </div>
                <button class="btn-menu-primary" (click)="gs.screen.set('character_create')">
                  {{ texts().newAdventureLabel }}
                </button>
                <button
                  class="btn-menu-secondary"
                  [disabled]="!gs.hasSavedRun()"
                  (click)="gs.loadSavedRun()"
                >
                  {{ texts().continueLabel }}
                </button>
                <button class="btn-menu-secondary" disabled>
                  {{ texts().recordsLabel }}
                </button>
              </div>

              <p class="menu-credit">{{ texts().menuCredit }}</p>
            </div>

            <button
              class="btn-debug"
              onclick="window.location.href='/debug'"
              title="Editor/visualizador de layouts dos andares"
            >
              {{ texts().debugLabel }}
            </button>
          </div>
        }

        @if (gs.screen() === 'character_create') {
          <div class="screen">
            <app-character-creation />
          </div>
        }

        @if (['dungeon', 'encounter', 'merchant', 'floor_transition'].includes(gs.screen())) {
          <app-game-layout />
        }

        @if (gs.screen() === 'game_over') {
          <div class="screen overlay-screen">
            <div class="overlay-content">
              <div class="overlay-icon">💀</div>
              <h2>{{ texts().defeatTitle }}</h2>
              <p>{{ texts().defeatMessage }}</p>
              <p class="floor-reached">
                {{ texts().floorReachedLabel }} {{ gs.floorNumber() }}/{{ gs.TOTAL_FLOORS }}
              </p>
              @if (gs.combatJournal().length > 0) {
                <button class="btn-journal" (click)="gs.downloadJournal()">
                  📜 Baixar Diário de Combate (JSON)
                </button>
              }
              <button class="btn-menu-primary" (click)="gs.screen.set('character_create')">
                {{ texts().retryLabel }}
              </button>
              <button class="btn-menu-secondary" (click)="gs.goToMenu()">
                {{ texts().mainMenuLabel }}
              </button>
            </div>
          </div>
        }

        @if (gs.screen() === 'victory') {
          <div class="screen overlay-screen victory">
            <div class="overlay-content">
              <div class="overlay-icon">🏆</div>
              <h2>{{ texts().victoryTitle }}</h2>
              <p>{{ texts().victoryMessage }}</p>
              <button class="btn-menu-primary" (click)="gs.screen.set('character_create')">
                {{ texts().replayLabel }}
              </button>
              <button class="btn-menu-secondary" (click)="gs.goToMenu()">
                {{ texts().mainMenuLabel }}
              </button>
            </div>
          </div>
        }

      </div>
    }
  `,
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  gs = inject(GameStateService);
  texts = computed(() => this.gs.campaign.activeCampaign().texts);
  readonly isDebugMap = window.location.pathname === '/debug';

  runes = Array.from({ length: 18 }, () => ({
    char: 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛟᛞ'[Math.floor(Math.random() * 24)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 3,
  }));
}
