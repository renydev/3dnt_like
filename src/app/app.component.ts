import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from './core/services/game-state.service';
import { GameLayoutComponent } from './modules/ui/game-layout/game-layout.component';
import { CharacterCreationComponent } from './dungeon/components/character-creation/character-creation.component';
import { CompanionSelectComponent } from './modules/ui/companion-select/companion-select.component';
import { DebugMapComponent } from './debug/debug-map.component';
import { MapDebugComponent } from './debug/map-debug/map-debug.component';
import { PRESET_CHARACTERS, CLASS_ICONS } from './core/models/character.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, GameLayoutComponent, CharacterCreationComponent, CompanionSelectComponent, DebugMapComponent, MapDebugComponent],
  template: `
    @if (isDebugMap) {
      <app-map-debug />
    } @else {
    <div class="game-wrapper">

      <!-- ── MENU PRINCIPAL ───────────────────────────────── -->
      @if (gs.screen() === 'menu') {
        <div class="screen menu-screen">
          <div class="menu-bg-runes">
            @for (r of runes; track $index) {
              <span class="bg-rune"
                [style.left.%]="r.x"
                [style.top.%]="r.y"
                [style.font-size.rem]="r.size">{{ r.char }}</span>
            }
          </div>

          <div class="menu-content">
            <div class="menu-logo">
              <div class="logo-subtitle">Masmorras de</div>
              <h1 class="logo-title">VALKARIA</h1>
              <div class="logo-edition">Roguelike · Sistema 3D&amp;T</div>
            </div>

            <div class="menu-buttons">
              <button class="btn-menu-primary" (click)="gs.screen.set('character_create')">
                ⚔️ Nova Aventura
              </button>
              <button class="btn-menu-secondary" disabled>
                📜 Continuar (em breve)
              </button>
              <button class="btn-menu-secondary" disabled>
                🏆 Recordes (em breve)
              </button>
            </div>

            <p class="menu-credit">Fan-game baseado em Valkaria (Tormenta RPG / Jambô) · Sistema 3D&amp;T</p>
          </div>

          <button class="btn-debug" (click)="gs.screen.set('debug_map')" title="Visualizar layouts dos andares">
            🗺️ Debug
          </button>
        </div>
      }

      <!-- ── DEBUG ────────────────────────────────────────── -->
      @if (gs.screen() === 'debug_map') {
        <div class="screen">
          <div style="padding:8px;background:#1a1a2e;display:flex;gap:8px;align-items:center">
            <button style="background:#166534;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px" onclick="window.location.href='/debug'">🗺️ Debug Mapa Interativo</button>
            <button style="background:#374151;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-size:12px" (click)="gs.goToMenu()">← Voltar ao Menu</button>
          </div>
          <app-debug-map />
        </div>
      }

      <!-- ── CRIAÇÃO DE PERSONAGEM ─────────────────────────── -->
      @if (gs.screen() === 'character_create') {
        <div class="screen">
          <app-character-creation />
        </div>
      }

      <!-- ── SELEÇÃO DE COMPANHEIRO ──────────────────────────── -->
      @if (gs.screen() === 'companion_select') {
        <div class="screen">
          <app-companion-select />
        </div>
      }

      <!-- ── JOGO (dungeon / encounter / floor_transition) ─── -->
      @if (['dungeon', 'encounter', 'floor_transition'].includes(gs.screen())) {
        <app-game-layout />
      }

      <!-- ── GAME OVER ─────────────────────────────────────── -->
      @if (gs.screen() === 'game_over') {
        <div class="screen overlay-screen">
          <div class="overlay-content">
            <div class="overlay-icon">💀</div>
            <h2>O Herói Caiu</h2>
            <p>As sombras de Valkaria reclamaram mais uma alma...</p>
            <p class="floor-reached">Chegou ao Andar {{ gs.floorNumber() }}/20</p>
            @if (gs.combatJournal().length > 0) {
              <button class="btn-journal" (click)="gs.downloadJournal()">
                📜 Baixar Diário de Combate (JSON)
              </button>
            }
            <button class="btn-menu-primary" (click)="gs.screen.set('character_create')">
              ⚔️ Tentar Novamente
            </button>
            <button class="btn-menu-secondary" (click)="gs.goToMenu()">
              🏠 Menu Principal
            </button>
          </div>
        </div>
      }

      <!-- ── VITÓRIA ────────────────────────────────────────── -->
      @if (gs.screen() === 'victory') {
        <div class="screen overlay-screen victory">
          <div class="overlay-content">
            <div class="overlay-icon">🏆</div>
            <h2>Valkaria Conquistada!</h2>
            <p>As trevas foram dissipadas. O herói se torna lenda!</p>
            <button class="btn-menu-primary" (click)="gs.screen.set('character_create')">
              ⚔️ Jogar Novamente
            </button>
            <button class="btn-menu-secondary" (click)="gs.goToMenu()">
              🏠 Menu Principal
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
  readonly isDebugMap = window.location.pathname === '/debug';

  runes = Array.from({ length: 18 }, () => ({
    char: '᚛᚜ᚁᚂᚃᚄᚅᚆᚇᚈᚉᚊᚋᚌᚍᚎᚏᚐᚑᚒᚓᚔᚕᚖᚗᚘᚙᚚ'[Math.floor(Math.random() * 30)],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 3,
  }));
}
