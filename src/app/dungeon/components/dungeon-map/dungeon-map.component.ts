import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameStateService } from '../../../core/services/game-state.service';
import { DungeonRoom, ROOM_ICONS, ROOM_LABELS } from '../../../core/models/dungeon.model';
import { Item, EquipSlot, getEffectiveStats, statBonusLabel, rarityColor } from '../../../core/models/item.model';

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

      <!-- ── MAPA HORIZONTAL (todos os andares) ───────────────────────────── -->
      <div class="map-scroll-container">
        <div class="map-track" [style.width.px]="svgW()" [style.height.px]="svgH()">
          <svg
            class="map-svg"
            [attr.viewBox]="svgViewBox()"
            [attr.width]="svgW()"
            [attr.height]="svgH()"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- Grade de fundo sutil -->
            <defs>
              <pattern id="grid-dots" x="0" y="0" [attr.width]="NODE_W" [attr.height]="NODE_H" patternUnits="userSpaceOnUse">
                <circle cx="0" cy="0" r="1.5" fill="#ffffff08" />
              </pattern>
              <filter id="glow-gold">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glow-amber">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <rect x="0" y="0" [attr.width]="svgW()" [attr.height]="svgH()" fill="url(#grid-dots)" />

            <!-- Linha do limiar do chefe -->
            <line
              [attr.x1]="bossThresholdX()"
              y1="8"
              [attr.x2]="bossThresholdX()"
              [attr.y2]="svgH() - 8"
              class="boss-threshold-line"
            />
            <text
              [attr.x]="bossThresholdX() + 6"
              y="20"
              class="boss-threshold-label"
            >CHEFE</text>
            <text
              [attr.x]="bossThresholdX() - 6"
              y="20"
              class="dungeon-zone-label"
            >MASMORRA</text>

            <!-- Conexões -->
            @for (conn of connections(); track conn.key) {
              <line
                [attr.x1]="conn.x1" [attr.y1]="conn.y1"
                [attr.x2]="conn.x2" [attr.y2]="conn.y2"
                [class]="'conn-line ' + conn.state"
              />
            }

            <!-- Nós das salas -->
            @for (room of floor()?.rooms; track room.id) {
              <g
                [class]="getRoomClass(room)"
                (click)="onRoomClick(room)"
              >
                <!-- Sombra -->
                <circle
                  [attr.cx]="getRoomX(room) + 2"
                  [attr.cy]="getRoomY(room) + 2"
                  [attr.r]="R"
                  class="room-shadow"
                />
                <!-- Halo reachable -->
                @if (isReachable(room) && !room.cleared) {
                  <circle
                    [attr.cx]="getRoomX(room)"
                    [attr.cy]="getRoomY(room)"
                    [attr.r]="R + 7"
                    class="room-reach-halo"
                  />
                }
                <!-- Halo atual -->
                @if (room.isCurrent) {
                  <circle
                    [attr.cx]="getRoomX(room)"
                    [attr.cy]="getRoomY(room)"
                    [attr.r]="R + 10"
                    class="room-halo"
                  />
                }
                <!-- Círculo principal -->
                <circle
                  [attr.cx]="getRoomX(room)"
                  [attr.cy]="getRoomY(room)"
                  [attr.r]="R"
                  class="room-circle"
                />
                <!-- Ícone / tipo -->
                @if (room.isVisible) {
                  <text
                    [attr.x]="getRoomX(room)"
                    [attr.y]="getRoomY(room) + 6"
                    text-anchor="middle"
                    class="room-icon-text"
                  >{{ room.cleared ? '🏕️' : (isTypeRevealed(room) ? getRoomIcon(room) : '?') }}</text>
                  <!-- Label abaixo do nó -->
                  <text
                    [attr.x]="getRoomX(room)"
                    [attr.y]="getRoomY(room) + R + 14"
                    text-anchor="middle"
                    class="room-label-text"
                  >{{ isTypeRevealed(room) ? getRoomLabel(room) : '???' }}</text>
                  <!-- Tick de liberada -->
                  @if (room.cleared) {
                    <text
                      [attr.x]="getRoomX(room) + R - 4"
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
      </div>

      <!-- ── Painel da câmara atual ────────────────────────────────────────── -->
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

      <!-- ── Inventário & Equipamento ──────────────────────────────────────── -->
      @if (gameState.character()) {
        <div class="inventory-panel">
          <button class="inv-toggle" (click)="showInventory.set(!showInventory())">
            🎒 Equipamento & Inventário {{ showInventory() ? '▲' : '▼' }}
          </button>
          @if (showInventory()) {
            <div class="inv-body">
              <div class="equip-section">
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
                    <span>F{{ s.forca }}</span>
                    <span>H{{ s.habilidade }}</span>
                    <span>R{{ s.resistencia }}</span>
                    <span>A{{ s.armadura }}</span>
                    <span>PF{{ s.poderFogo }}</span>
                  </div>
                }
              </div>
              <div class="inv-section">
                <h4 class="inv-title">Inventário ({{ gameState.character()!.inventory.length }})</h4>
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
            </div>
          }
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
  showInventory = signal(false);

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

  // ── Layout horizontal ────────────────────────────────────────────────────
  readonly R      = 24;   // raio do nó
  readonly NODE_W = 120;  // espaçamento horizontal (profundidade)
  readonly NODE_H = 80;   // espaçamento vertical (lanes)
  readonly PAD_X  = 56;
  readonly PAD_Y  = 44;

  isSimple = computed(() =>
    this.floor()?.theme?.specialRule?.includes('Masmorra mais simples') ?? false
  );

  clearedCount = computed(() =>
    this.floor()?.rooms.filter(r => r.cleared).length ?? 0
  );

  /** Linha de referência: row da entrada */
  private entranceRow = computed(() =>
    this.floor()?.rooms.find(r => r.type === 'entrance')?.row ?? 0
  );

  /** Profundidade do nó = distância da entrada (col no eixo X) */
  private depth(room: DungeonRoom): number {
    return Math.abs(room.row - this.entranceRow());
  }

  private maxDepth = computed(() =>
    Math.max(...(this.floor()?.rooms.map(r => this.depth(r)) ?? [0]))
  );

  private maxLane = computed(() =>
    Math.max(...(this.floor()?.rooms.map(r => r.col) ?? [0]))
  );

  svgW = computed(() => this.PAD_X * 2 + this.maxDepth() * this.NODE_W);
  svgH = computed(() => this.PAD_Y * 2 + this.maxLane() * this.NODE_H);
  svgViewBox = computed(() => `0 0 ${this.svgW()} ${this.svgH()}`);

  /** X do limiar do chefe — meio-caminho entre o penúltimo grupo e o boss */
  bossThresholdX = computed(() =>
    this.PAD_X + this.maxDepth() * this.NODE_W - this.NODE_W * 0.55
  );

  getRoomX(room: DungeonRoom): number {
    return this.PAD_X + this.depth(room) * this.NODE_W;
  }

  getRoomY(room: DungeonRoom): number {
    return this.PAD_Y + room.col * this.NODE_H;
  }

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
        const visible = room.isVisible && dest.isVisible;
        const partial  = room.isVisible || dest.isVisible;
        result.push({
          key,
          x1: this.getRoomX(room), y1: this.getRoomY(room),
          x2: this.getRoomX(dest), y2: this.getRoomY(dest),
          state: visible ? 'visible' : partial ? 'partial' : 'hidden',
        });
      });
    });
    return result;
  });

  getRoomClass(room: DungeonRoom): string {
    const c = ['map-room', `map-room-${room.type}`];
    if (!room.isVisible)       c.push('map-room-hidden');
    if (room.isCurrent)        c.push('map-room-current');
    if (room.cleared)          c.push('map-room-cleared');
    if (this.isReachable(room)) c.push('map-room-reachable');
    return c.join(' ');
  }

  getRoomIcon(room: DungeonRoom): string  { return ROOM_ICONS[room.type]; }
  getRoomLabel(room: DungeonRoom): string { return ROOM_LABELS[room.type]; }

  isTypeRevealed(room: DungeonRoom): boolean {
    if (room.entered || room.cleared) return true;
    return this.currentRoom()?.connections.includes(room.id) ?? false;
  }

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

  enterRoom(): void { this.gameState.screen.set('encounter'); }
  nextFloor(): void { this.gameState.proceedToNextFloor(); }
  restQuick(): void { this.gameState.restQuick(); }
  restDeep(): void  { this.gameState.restDeep(); }
}
