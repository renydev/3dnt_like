import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { DungeonRoom, MapHotspot, ROOM_ICONS, ROOM_LABELS } from '../../../core/models/dungeon.model';

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

      <!-- ── MODO IMAGEM (ex: Allihanna) ───────────────────────────────── -->
      @if (floor()?.imageMap) {
        <div class="map-container image-map-container">
          <div class="image-map-wrapper">
            <img [src]="floor()!.imageMap!.url" class="dungeon-image" alt="Mapa da Masmorra" />
            <svg
              class="hotspot-layer"
              [attr.viewBox]="floor()!.imageMap!.viewBox"
              xmlns="http://www.w3.org/2000/svg"
            >
              @for (hs of floor()!.imageMap!.hotspots; track hs.roomId) {
                @if (getRoomById(hs.roomId); as room) {
                  <g
                    [class]="getHotspotClass(room)"
                    (click)="onHotspotClick(room)"
                    [attr.tabindex]="isHotspotClickable(room) ? 0 : -1"
                    [attr.aria-label]="getHotspotAriaLabel(room)"
                  >
                    @if (isReachable(room) && !room.cleared) {
                      <circle
                        [attr.cx]="hs.cx" [attr.cy]="hs.cy" [attr.r]="(hs.r ?? 0) + 8"
                        class="hotspot-halo"
                      />
                    }
                    <circle
                      [attr.cx]="hs.cx" [attr.cy]="hs.cy" [attr.r]="hs.r"
                      class="hotspot-circle"
                    />
                    <text
                      [attr.x]="hs.cx" [attr.y]="hs.cy + 1"
                      class="hotspot-icon"
                      text-anchor="middle" dominant-baseline="middle"
                    >{{ getHotspotIcon(room) }}</text>
                    <text
                      [attr.x]="hs.cx" [attr.y]="hs.cy + (hs.r ?? 0) + 12"
                      class="hotspot-label"
                      text-anchor="middle"
                    >{{ hs.label }}</text>
                  </g>
                }
              }
            </svg>
          </div>
        </div>

        <!-- Painel da câmara atual (modo imagem) -->
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
              <p class="info-desc">
                {{ currentRoom()!.cleared ? 'Esta câmara foi resolvida. O grupo pode descansar aqui com segurança.' : currentRoom()!.description }}
              </p>
              @if (!currentRoom()!.cleared && currentRoom()!.type !== 'entrance' && currentRoom()!.type !== 'empty') {
                <button class="btn-encounter" (click)="enterRoom()">
                  ⚔️ Enfrentar o Encontro
                </button>
              }
              @if (canRest()) {
                <button class="btn-rest" [disabled]="currentRoom()!.rested" (click)="rest()">
                  {{ currentRoom()!.rested ? '💤 Já descansou aqui' : '🏕️ Descansar' }}
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
              <button class="btn-encounter btn-enter-unknown" (click)="onHotspotClick(currentRoom()!)">
                🚪 Adentrar a Câmara
              </button>
            }
          </div>
        }
      }

      @else {
        <div class="map-container">
          <svg
            class="map-svg"
            [attr.viewBox]="svgViewBox()"
            [attr.width]="svgW()"
            [attr.height]="svgH()"
          >
            <!-- Conexões -->
            @for (conn of connections(); track conn.key) {
              <line
                [attr.x1]="conn.x1" [attr.y1]="conn.y1"
                [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                [class]="'conn-line ' + conn.state"
              />
            }

            <!-- Salas -->
            @for (room of floor()?.rooms; track room.id) {
              <g
                [class]="getSvgRoomClass(room)"
                (click)="onRoomClick(room)"
              >
                <!-- Sombra -->
                <circle
                  [attr.cx]="getRoomX(room) + 2"
                  [attr.cy]="getRoomY(room) + 2"
                  [attr.r]="R"
                  class="room-shadow"
                />
                <!-- Círculo principal -->
                <circle
                  [attr.cx]="getRoomX(room)"
                  [attr.cy]="getRoomY(room)"
                  [attr.r]="R"
                  class="room-circle"
                />
                @if (room.isVisible) {
                  <!-- Halo de sala atual -->
                  @if (room.isCurrent) {
                    <circle
                      [attr.cx]="getRoomX(room)"
                      [attr.cy]="getRoomY(room)"
                      [attr.r]="R + 8"
                      class="room-halo"
                    />
                  }
                  <!-- Halo de sala alcançável -->
                  @if (isReachable(room) && !room.cleared) {
                    <circle
                      [attr.cx]="getRoomX(room)"
                      [attr.cy]="getRoomY(room)"
                      [attr.r]="R + 6"
                      class="room-reach-halo"
                    />
                  }
                  <!-- Ícone -->
                  <text
                    [attr.x]="getRoomX(room)"
                    [attr.y]="getRoomY(room) + 6"
                    text-anchor="middle"
                    class="room-icon-text"
                  >{{ room.cleared ? '🏕️' : getRoomIcon(room) }}</text>
                  <!-- Label -->
                  <text
                    [attr.x]="getRoomX(room)"
                    [attr.y]="getRoomY(room) + R + 14"
                    text-anchor="middle"
                    class="room-label-text"
                  >{{ getRoomLabel(room) }}</text>
                  <!-- Check de liberada -->
                  @if (room.cleared) {
                    <text
                      [attr.x]="getRoomX(room) + R - 2"
                      [attr.y]="getRoomY(room) - R + 10"
                      class="room-cleared-mark"
                    >✓</text>
                  }
                } @else {
                  <text
                    [attr.x]="getRoomX(room)"
                    [attr.y]="getRoomY(room) + 6"
                    text-anchor="middle"
                    class="room-icon-text room-hidden-icon"
                  >?</text>
                }
              </g>
            }
          </svg>
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
            @if (canRest()) {
              <button class="btn-rest" [disabled]="currentRoom()!.rested" (click)="rest()">
                {{ currentRoom()!.rested ? '💤 Já descansou aqui' : '🏕️ Descansar' }}
              </button>
            }
            @if (currentRoom()!.cleared && currentRoom()!.type === 'boss') {
              <button class="btn-next-floor" (click)="nextFloor()">
                🔽 Avançar para o Próximo Andar
              </button>
            }
          </div>
        }
      }
    </div>
  `,
  styleUrls: ['./dungeon-map.component.scss']
})
export class DungeonMapComponent {
  private gameState = inject(GameStateService);

  floor = this.gameState.currentFloor;
  currentRoom = this.gameState.currentRoom;

  // SVG layout constants (mesmos do debug map)
  readonly R     = 28;   // raio do círculo
  readonly COL_W = 96;
  readonly ROW_H = 100;
  readonly PAD_X = 50;
  readonly PAD_Y = 50;

  isSimple = computed(() =>
    this.floor()?.theme?.specialRule?.includes('Masmorra mais simples') ?? false
  );

  clearedCount = computed(() =>
    this.floor()?.rooms.filter(r => r.cleared).length ?? 0
  );

  private maxRowVal = computed(() =>
    Math.max(...(this.floor()?.rooms.map(r => r.row) ?? [0]))
  );

  private maxColVal = computed(() =>
    Math.max(...(this.floor()?.rooms.map(r => r.col) ?? [4]))
  );

  svgW = computed(() => this.PAD_X * 2 + this.maxColVal() * this.COL_W);
  svgH = computed(() => this.PAD_Y * 2 + this.maxRowVal() * this.ROW_H);

  svgViewBox = computed(() => `0 0 ${this.svgW()} ${this.svgH()}`);

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
        result.push({
          key,
          x1: this.getRoomX(room), y1: this.getRoomY(room),
          x2: this.getRoomX(dest), y2: this.getRoomY(dest),
          state: room.isVisible && dest.isVisible ? 'visible'
               : room.isVisible || dest.isVisible ? 'partial' : 'hidden'
        });
      });
    });
    return result;
  });

  getRoomById(id: number): DungeonRoom | undefined {
    return this.floor()?.rooms.find(r => r.id === id);
  }

  getSvgRoomClass(room: DungeonRoom): string {
    const classes = ['svg-room', `svg-room-${room.type}`];
    if (!room.isVisible) classes.push('svg-room-hidden');
    if (room.isCurrent) classes.push('svg-room-current');
    if (room.cleared) classes.push('svg-room-cleared');
    if (this.isReachable(room)) classes.push('svg-room-reachable');
    return classes.join(' ');
  }

  getHotspotClass(room: DungeonRoom): string {
    const classes = ['hotspot'];
    if (room.cleared) classes.push('hs-cleared');
    else if (room.isCurrent) classes.push('hs-current');
    else if (this.isReachable(room)) classes.push('hs-reachable');
    else if (room.type === 'entrance') classes.push('hs-entrance');
    else classes.push('hs-unknown');
    if (this.isHotspotClickable(room)) classes.push('hs-clickable');
    return classes.join(' ');
  }

  getHotspotIcon(room: DungeonRoom): string {
    if (room.cleared) return '🏕️';
    if (room.entered || room.isCurrent) return ROOM_ICONS[room.type];
    if (room.type === 'entrance') return ROOM_ICONS.entrance;
    return '?';
  }

  getHotspotAriaLabel(room: DungeonRoom): string {
    if (room.cleared) return `${room.name} — Liberada`;
    if (room.entered) return room.name;
    return 'Câmara desconhecida';
  }

  isHotspotClickable(room: DungeonRoom): boolean {
    return this.isReachable(room) && !room.cleared;
  }

  getRoomX(room: DungeonRoom): number {
    return this.PAD_X + room.col * this.COL_W;
  }
  getRoomY(room: DungeonRoom): number {
    return this.PAD_Y + (this.maxRowVal() - room.row) * this.ROW_H;
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

  onHotspotClick(room: DungeonRoom): void {
    if (!this.isReachable(room) && !room.isCurrent) return;
    if (room.cleared) return;
    if (room.isCurrent && room.entered) {
      if (room.type !== 'entrance' && room.type !== 'empty') {
        this.gameState.screen.set('encounter');
      }
      return;
    }
    this.gameState.moveToRoom(room.id);
  }

  canRest = computed(() => {
    const r = this.currentRoom();
    if (!r) return false;
    return r.cleared || r.type === 'entrance' || r.type === 'empty';
  });

  enterRoom(): void { this.gameState.screen.set('encounter'); }
  nextFloor(): void { this.gameState.proceedToNextFloor(); }
  rest(): void { this.gameState.restAtRoom(); }
}
