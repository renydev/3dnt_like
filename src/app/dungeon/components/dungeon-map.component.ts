import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../core/services/game-state.service';
import { DungeonRoom, ROOM_ICONS, ROOM_LABELS, RoomType } from '../../core/models/dungeon.model';

@Component({
  selector: 'app-dungeon-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dungeon-map">
      <div class="floor-header">
        <span class="floor-theme-icon">{{ floor()?.theme?.icon }}</span>
        <div class="floor-info">
          <h2 class="floor-title">
            Andar {{ floor()?.floorNumber }}/20 — {{ floor()?.theme?.godName }}
          </h2>
          <p class="floor-theme">{{ floor()?.theme?.name }}</p>
          <p class="floor-domain">{{ floor()?.theme?.godDomain }}</p>
        </div>
        <div class="floor-progress">
          <span class="progress-label">Limpas</span>
          <span class="progress-value">{{ clearedCount() }}/{{ floor()?.totalRooms }}</span>
        </div>
      </div>

      @if (floor()?.theme?.specialRule && !isSimple()) {
        <div class="special-rule">
          <span class="sr-icon">⚠️</span>
          <span>{{ floor()?.theme?.specialRule }}</span>
        </div>
      }

      <div class="map-container">
        <div class="map-inner" [style.width.px]="mapWidth()" [style.height.px]="mapHeight()">
          <svg class="connections-layer" [attr.viewBox]="svgViewBox()" [attr.width]="mapWidth()" [attr.height]="mapHeight()">
            @for (conn of connections(); track conn.key) {
              <line
                [attr.x1]="conn.x1" [attr.y1]="conn.y1"
                [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                [class]="'conn-line ' + conn.state"
              />
            }
          </svg>

          <div class="rooms-layer">
            @for (room of floor()?.rooms; track room.id) {
              <div
                [class]="getRoomClass(room)"
                [style.left.px]="getRoomX(room)"
                [style.top.px]="getRoomY(room)"
                (click)="onRoomClick(room)"
                [title]="room.isVisible ? room.name : '???'"
              >
              @if (room.isVisible) {
                <div class="room-inner">
                  <span class="room-icon">{{ getRoomIcon(room) }}</span>
                  @if (room.cleared) { <span class="cleared-mark">✓</span> }
                  @if (room.isCurrent) { <span class="current-pulse"></span> }
                </div>
                <span class="room-label">{{ getRoomLabel(room) }}</span>
              } @else {
                <div class="room-inner hidden-room">
                  <span class="room-icon">?</span>
                </div>
              }
            </div>
            }
          </div>
        </div>
      </div>

      @if (currentRoom()) {
        <div class="current-room-info">
          <div class="info-header">
            <span class="info-icon">{{ getRoomIcon(currentRoom()!) }}</span>
            <div>
              <h3>{{ currentRoom()!.name }}</h3>
              <span class="room-type-badge room-badge-{{ currentRoom()!.type }}">
                {{ getRoomLabel(currentRoom()!) }}
              </span>
            </div>
          </div>
          <p class="info-desc">{{ currentRoom()!.description }}</p>
          @if (!currentRoom()!.cleared && currentRoom()!.type !== 'entrance' && currentRoom()!.type !== 'empty') {
            <button class="btn-encounter" (click)="enterRoom()">
              ⚔️ Entrar na Sala
            </button>
          }
          @if (currentRoom()!.cleared && currentRoom()!.type === 'boss') {
            <button class="btn-next-floor" (click)="nextFloor()">
              🔽 Avançar para o Próximo Andar
            </button>
          }
        </div>
      }
    </div>
  `,
  styleUrls: ['./dungeon-map.component.scss']
})
export class DungeonMapComponent {
  private gameState = inject(GameStateService);

  floor = this.gameState.currentFloor;
  currentRoom = this.gameState.currentRoom;

  CELL_W = 90;
  CELL_H = 110;
  COLS = 5;

  isSimple = computed(() =>
    this.floor()?.theme?.specialRule?.includes('Masmorra mais simples') ?? false
  );

  clearedCount = computed(() =>
    this.floor()?.rooms.filter(r => r.cleared).length ?? 0
  );

  maxRow = computed(() =>
    Math.max(...(this.floor()?.rooms.map(r => r.row) ?? [0]))
  );

  maxCol = computed(() =>
    Math.max(...(this.floor()?.rooms.map(r => r.col) ?? [4]))
  );

  mapWidth = computed(() => (this.maxCol() + 1) * this.CELL_W + 20);
  mapHeight = computed(() => (this.maxRow() + 1) * this.CELL_H + 20);

  svgViewBox = computed(() =>
    `0 0 ${this.mapWidth()} ${this.mapHeight()}`
  );

  connections = computed(() => {
    const rooms = this.floor()?.rooms ?? [];
    const result: any[] = [];
    const seen = new Set<string>();
    rooms.forEach(room => {
      room.connections.forEach(connId => {
        const key = [Math.min(room.id, connId), Math.max(room.id, connId)].join('-');
        if (seen.has(key)) return;
        seen.add(key);
        const dest = rooms.find(r => r.id === connId);
        if (!dest) return;
        const x1 = this.getRoomX(room);
        const y1 = this.getRoomY(room);
        const x2 = this.getRoomX(dest);
        const y2 = this.getRoomY(dest);
        let state = 'hidden';
        if (room.isVisible && dest.isVisible) state = 'visible';
        else if (room.isVisible || dest.isVisible) state = 'partial';
        result.push({ key, x1, y1, x2, y2, state });
      });
    });
    return result;
  });

  getRoomClass(room: DungeonRoom): string {
    const classes = ['room-node', `room-${room.type}`];
    if (room.isVisible) classes.push('visible');
    if (room.isCurrent) classes.push('current');
    if (room.cleared) classes.push('cleared');
    if (this.isReachable(room)) classes.push('reachable');
    return classes.join(' ');
  }

  getRoomX(room: DungeonRoom): number {
    return room.col * this.CELL_W + 10;
  }

  getRoomY(room: DungeonRoom): number {
    return room.row * this.CELL_H + 10;
  }

  getRoomIcon(room: DungeonRoom): string { return ROOM_ICONS[room.type]; }
  getRoomLabel(room: DungeonRoom): string { return ROOM_LABELS[room.type]; }

  isReachable(room: DungeonRoom): boolean {
    const current = this.currentRoom();
    if (!current || room.isCurrent || !room.isVisible) return false;
    return current.connections.includes(room.id);
  }

  onRoomClick(room: DungeonRoom): void {
    if (!room.isVisible || !this.isReachable(room)) return;
    this.gameState.moveToRoom(room.id);
  }

  enterRoom(): void { this.gameState.screen.set('encounter'); }
  nextFloor(): void { this.gameState.proceedToNextFloor(); }
}
