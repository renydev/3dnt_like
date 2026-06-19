import Phaser from 'phaser';
import { Injector, runInInjectionContext, effect } from '@angular/core';
import { GameStateService } from '../../../core/services/game-state.service';
import { DungeonRoom, ROOM_ICONS, ROOM_LABELS } from '../../../core/models/dungeon.model';

const R = 24;
const NODE_W = 120;
const NODE_H = 80;
const PAD_X = 56;
const PAD_Y = 44;

const COLOR_BG = 0x07070f;
const COLOR_ROOM = 0x14141f;
const COLOR_ROOM_CURRENT = 0xd4ac0d;
const COLOR_ROOM_CLEARED = 0x2c6b3f;
const COLOR_ROOM_REACHABLE = 0x4a7fc0;
const COLOR_ROOM_HIDDEN = 0x222230;
const COLOR_CONN_VISIBLE = 0x4a4a60;
const COLOR_CONN_PARTIAL = 0x2a2a3a;
const COLOR_CONN_HIDDEN = 0x161620;

/**
 * Cena de exploração do andar: renderiza salas e conexões e trata clique
 * para mover/entrar — espelha a lógica que existia em dungeon-map.component.ts.
 */
export class MapScene extends Phaser.Scene {
  private gs!: GameStateService;
  private graphics!: Phaser.GameObjects.Graphics;
  private roomNodes = new Map<number, Phaser.GameObjects.Container>();

  constructor() {
    super({ key: 'MapScene' });
  }

  init(data: { injector: Injector }): void {
    this.gs = data.injector.get(GameStateService);
    runInInjectionContext(data.injector, () => {
      effect(() => {
        this.gs.currentFloor();
        this.gs.currentRoomId();
        if (this.scene.isActive()) this.redraw();
      });
    });
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.cameras.main.setBackgroundColor(COLOR_BG);
    this.redraw();
  }

  private depth(room: DungeonRoom, entranceRow: number): number {
    return Math.abs(room.row - entranceRow);
  }

  private redraw(): void {
    if (!this.graphics) return;
    this.graphics.clear();
    this.roomNodes.forEach(c => c.destroy());
    this.roomNodes.clear();

    const floor = this.gs.currentFloor();
    if (!floor) return;
    const rooms = floor.rooms;
    const entranceRow = rooms.find(r => r.type === 'entrance')?.row ?? 0;

    const getX = (room: DungeonRoom) => PAD_X + this.depth(room, entranceRow) * NODE_W;
    const getY = (room: DungeonRoom) => PAD_Y + room.col * NODE_H;

    const current = rooms.find(r => r.isCurrent) ?? null;
    const isReachable = (room: DungeonRoom): boolean => {
      if (!current || room.isCurrent || !room.isVisible) return false;
      if (room.cleared) return true;
      if (current.connections.includes(room.id)) return true;
      return (current.secretConnections?.includes(room.id) ?? false) && !!room.isSecretRevealed;
    };

    // Conexões
    const seen = new Set<string>();
    rooms.forEach(room => {
      room.connections.forEach(connId => {
        const key = [Math.min(room.id, connId), Math.max(room.id, connId)].join('-');
        if (seen.has(key)) return;
        seen.add(key);
        const dest = rooms.find(r => r.id === connId);
        if (!dest) return;
        const visible = room.isVisible && dest.isVisible;
        const partial = room.isVisible || dest.isVisible;
        const color = visible ? COLOR_CONN_VISIBLE : partial ? COLOR_CONN_PARTIAL : COLOR_CONN_HIDDEN;
        this.graphics.lineStyle(2, color, 1);
        this.graphics.lineBetween(getX(room), getY(room), getX(dest), getY(dest));
      });
    });

    // Salas
    rooms.forEach(room => {
      const x = getX(room);
      const y = getY(room);
      const container = this.add.container(x, y);

      const fillColor = !room.isVisible ? COLOR_ROOM_HIDDEN
        : room.isCurrent ? COLOR_ROOM_CURRENT
        : room.cleared ? COLOR_ROOM_CLEARED
        : isReachable(room) ? COLOR_ROOM_REACHABLE
        : COLOR_ROOM;

      const circle = this.add.circle(0, 0, R, fillColor, 1).setStrokeStyle(2, 0x000000, 0.4);
      container.add(circle);

      const isTypeRevealed = room.entered || room.cleared
        || (current?.connections.includes(room.id) ?? false);

      const iconText = room.isVisible
        ? (room.cleared ? '🏕️' : (isTypeRevealed ? ROOM_ICONS[room.type] : '?'))
        : '?';
      const icon = this.add.text(0, 0, iconText, { fontSize: '20px' }).setOrigin(0.5);
      container.add(icon);

      if (room.isVisible) {
        const labelText = isTypeRevealed ? ROOM_LABELS[room.type] : '???';
        const label = this.add.text(0, R + 14, labelText, { fontSize: '11px', color: '#aaa' }).setOrigin(0.5);
        container.add(label);
      }

      if (room.isVisible || room.isCurrent) {
        circle.setInteractive({ useHandCursor: true });
        circle.on('pointerdown', () => this.onRoomClick(room));
      }

      this.roomNodes.set(room.id, container);
    });
  }

  private onRoomClick(room: DungeonRoom): void {
    const floor = this.gs.currentFloor();
    if (!floor) return;
    const current = floor.rooms.find(r => r.isCurrent) ?? null;
    const isReachable = !!current && !room.isCurrent && !!room.isVisible
      && (room.cleared
        || current.connections.includes(room.id)
        || ((current.secretConnections?.includes(room.id) ?? false) && !!room.isSecretRevealed));

    if (!room.isVisible && !room.isCurrent) return;
    if (!isReachable && !room.isCurrent) return;
    if (room.cleared) { this.gs.moveToRoom(room.id); return; }
    if (room.isCurrent && room.entered) {
      if (room.type !== 'entrance' && room.type !== 'empty') {
        this.gs.screen.set('encounter');
      }
      return;
    }
    this.gs.moveToRoom(room.id);
  }
}
