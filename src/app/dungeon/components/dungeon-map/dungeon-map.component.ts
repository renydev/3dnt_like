import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { DungeonRoom, ROOM_ICONS, ROOM_LABELS } from '../../../core/models/dungeon.model';
import { Item, EquipSlot, getEffectiveStats, statBonusLabel, rarityColor } from '../../../core/models/item.model';
import { GameCanvasComponent } from '../game-canvas/game-canvas.component';
import { MapScene } from '../../phaser/scenes/map.scene';

@Component({
  selector: 'app-dungeon-map',
  standalone: true,
  imports: [CommonModule, GameCanvasComponent],
  template: `
    <div class="dungeon-map">

      <!-- ── COLUNA ESQUERDA: andar + sala atual ─────────────────────────── -->
      <div class="side-col side-left">
        <div class="floor-header">
          <span class="floor-theme-icon">{{ floor()?.theme?.icon }}</span>
          <div class="floor-info">
            <h2 class="floor-title">Andar {{ floor()?.floorNumber }}/{{ gameState.TOTAL_FLOORS }}</h2>
            <p class="floor-theme">{{ floor()?.theme?.name }}</p>
            <p class="floor-domain">{{ floor()?.theme?.godDomain }}</p>
          </div>
        </div>
        <div class="floor-progress-row">
          <span class="progress-label">Salas limpas</span>
          <span class="progress-value">{{ clearedCount() }}/{{ floor()?.totalRooms }}</span>
        </div>

        @if (floor()?.theme?.specialRule && !isSimple()) {
          <div class="special-rule">
            <span class="sr-icon">⚠️</span>
            <span>{{ floor()?.theme?.specialRule }}</span>
          </div>
        }

        <!-- ── Painel da câmara atual ──────────────────────────────────── -->
        @if (currentRoom()) {
          <div class="current-room-info">
            @if (currentRoom()!.entered || currentRoom()!.cleared) {
              <div class="info-header">
                <span class="info-icon">{{ getRoomIcon(currentRoom()!) }}</span>
                <div>
                  <h3>{{ currentRoom()!.name }}</h3>
                  <span class="room-type-badge room-badge-{{ currentRoom()!.cleared ? 'rest' : currentRoom()!.type }}">
                    {{ currentRoom()!.cleared ? 'Descanso' : getRoomLabel(currentRoom()!) }}
                  </span>
                </div>
              </div>
              <p class="info-desc">{{ currentRoom()!.description }}</p>
              @if (!currentRoom()!.cleared && currentRoom()!.type !== 'entrance' && currentRoom()!.type !== 'empty') {
                <button class="btn-encounter" (click)="enterRoom()">
                  ⚔️ Enfrentar o Encontro
                </button>
              }
              @if (canQuickRest() && !canDeepRest()) {
                <button class="btn-rest" [disabled]="currentRoom()!.rested" (click)="restQuick()">
                  {{ currentRoom()!.rested ? '💤 Já descansou aqui' : '💤 Descanso Rápido (50% PV/PM)' }}
                </button>
              }
              @if (canDeepRest()) {
                <button class="btn-rest btn-deep-rest" [disabled]="currentRoom()!.rested" (click)="restDeep()">
                  {{ currentRoom()!.rested ? '🏕️ Já descansou aqui' : '🏕️ Descanso Profundo (PV/PM total)' }}
                </button>
              }
              @if (currentRoom()!.cleared && currentRoom()!.type === 'boss') {
                <button class="btn-next-floor" (click)="nextFloor()">
                  🔽 Avançar para o Próximo Andar
                </button>
              }
            } @else {
              <div class="info-header unknown-room">
                <span class="info-icon">❓</span>
                <div>
                  <h3>Câmara Desconhecida</h3>
                  <span class="room-type-badge room-badge-empty">Inexplorada</span>
                </div>
              </div>
              <p class="info-desc">Ninguém sabe o que aguarda nesta câmara. Entre para descobrir.</p>
              <button class="btn-encounter btn-enter-unknown" (click)="onRoomClick(currentRoom()!)">
                🚪 Adentrar a Câmara
              </button>
            }
          </div>
        }
      </div>

      <!-- ── CENTRO: MAPA (renderizado em Phaser) ────────────────────────── -->
      <div class="map-canvas-area">
        <app-game-canvas [sceneClass]="mapSceneClass" sceneKey="MapScene" backgroundColor="#33333d" />
      </div>

      <!-- ── COLUNA DIREITA: equipamento + inventário ────────────────────── -->
      @if (gameState.character()) {
        <div class="side-col side-right">
          <div class="side-panel-title">🎒 Equipamento</div>
          <div class="equip-slots">
            @for (slot of equipSlots; track slot.key) {
              <div class="equip-slot">
                <span class="slot-label">{{ slot.icon }} {{ slot.label }}</span>
                @if (gameState.character()!.equipment[slot.key]; as eq) {
                  <div class="equipped-item">
                    <span class="eq-icon">{{ eq.icon }}</span>
                    <div class="eq-info">
                      <span class="eq-name" [style.color]="rarityColor(eq.rarity)">{{ eq.name }}</span>
                      @if (eq.statBonus) {
                        <span class="eq-bonus">{{ statBonusLabel(eq.statBonus) }}</span>
                      }
                    </div>
                    <button class="eq-unequip" (click)="unequip(slot.key)" title="Desequipar">✕</button>
                  </div>
                } @else {
                  <span class="slot-empty">— vazio —</span>
                }
              </div>
            }
          </div>
          @if (effectiveStats(); as s) {
            <div class="eff-stats">
              <span>P{{ s.poder }}</span>
              <span>H{{ s.habilidade }}</span>
              <span>R{{ s.resistencia }}</span>
              <span>A{{ s.armadura }}</span>
            </div>
          }

          <div class="side-panel-title">Inventário ({{ gameState.character()!.inventory.length }})</div>
          @if (gameState.character()!.inventory.length === 0) {
            <p class="inv-empty">Nenhum item no inventário.</p>
          }
          <div class="inv-grid">
            @for (item of gameState.character()!.inventory; track $index) {
              <div class="inv-item" [title]="item.description">
                <span class="inv-icon">{{ item.icon }}</span>
                <span class="inv-name" [style.color]="rarityColor(item.rarity)">{{ item.name }}</span>
                @if (item.statBonus) {
                  <span class="inv-bonus">{{ statBonusLabel(item.statBonus) }}</span>
                }
                @if (item.slot) {
                  <button class="inv-equip" (click)="equip(item)">Equipar</button>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./dungeon-map.component.scss']
})
export class DungeonMapComponent {
  gameState = inject(GameStateService);

  floor       = this.gameState.currentFloor;
  currentRoom = this.gameState.currentRoom;

  readonly equipSlots: { key: EquipSlot; label: string; icon: string }[] = [
    { key: 'weapon',     label: 'Arma',       icon: '⚔️' },
    { key: 'offhand',    label: 'Mão Sec.',   icon: '🛡️' },
    { key: 'armor',      label: 'Armadura',   icon: '🥋' },
    { key: 'head',       label: 'Cabeça',     icon: '⛑️' },
    { key: 'gloves',     label: 'Luvas',      icon: '🧤' },
    { key: 'boots',      label: 'Botas',      icon: '👢' },
    { key: 'ring_left',  label: 'Anel Esq.',  icon: '💍' },
    { key: 'ring_right', label: 'Anel Dir.',  icon: '💍' },
  ];

  effectiveStats = computed(() => {
    const c = this.gameState.character();
    return c ? getEffectiveStats(c) : null;
  });

  readonly statBonusLabel = statBonusLabel;
  readonly rarityColor    = rarityColor;

  equip(item: Item)        { this.gameState.equipItem(item); }
  unequip(slot: EquipSlot) { this.gameState.unequipItem(slot); }

  readonly mapSceneClass = MapScene;

  isSimple = computed(() =>
    this.floor()?.theme?.specialRule?.includes('Masmorra mais simples') ?? false
  );

  clearedCount = computed(() =>
    this.floor()?.rooms.filter(r => r.cleared).length ?? 0
  );

  getRoomIcon(room: DungeonRoom): string  { return ROOM_ICONS[room.type]; }
  getRoomLabel(room: DungeonRoom): string { return ROOM_LABELS[room.type]; }

  isReachable(room: DungeonRoom): boolean {
    const current = this.currentRoom();
    if (!current || room.isCurrent || !room.isVisible) return false;
    if (room.cleared) return true;
    if (current.connections.includes(room.id)) return true;
    return (current.secretConnections?.includes(room.id) ?? false) && !!room.isSecretRevealed;
  }

  onRoomClick(room: DungeonRoom): void {
    if (!room.isVisible && !room.isCurrent) return;
    if (!this.isReachable(room) && !room.isCurrent) return;
    if (room.cleared) { this.gameState.moveToRoom(room.id); return; }
    if (room.isCurrent && room.entered) {
      if (room.type !== 'entrance' && room.type !== 'empty') {
        this.gameState.screen.set('encounter');
      }
      return;
    }
    this.gameState.moveToRoom(room.id);
  }

  canQuickRest = computed(() => {
    const r = this.currentRoom();
    return !!r && r.cleared && r.type !== 'boss' && r.type !== 'entrance';
  });

  canDeepRest = computed(() => {
    const r = this.currentRoom();
    return !!r && r.type === 'rest' && r.cleared;
  });

  enterRoom(): void {
    const room = this.currentRoom();
    if (!room) return;
    this.gameState.enterCombatRoom(room.id, room.type);
  }
  nextFloor(): void { this.gameState.proceedToNextFloor(); }
  restQuick(): void { this.gameState.restQuick(); }
  restDeep(): void  { this.gameState.restDeep(); }
}
