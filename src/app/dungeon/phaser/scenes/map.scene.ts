import Phaser from 'phaser';
import { Injector, runInInjectionContext, effect } from '@angular/core';
import { GameStateService } from '../../../core/services/game-state.service';
import { DungeonRoom, ROOM_ICONS, ROOM_LABELS } from '../../../core/models/dungeon.model';

// Espaçamento "base" entre nós (lanes na horizontal, profundidade na vertical).
// O mapa inteiro é escalado para caber no canvas disponível, então estes
// valores são o tamanho-alvo antes do ajuste de escala — mantém os nós
// próximos como uma trilha estilo Slay the Spire / Pokelike, não um grid solto.
const R = 16;
const NODE_W = 64;
const NODE_H = 64;
const PAD = 36;
const MAX_SCALE = 1.4;

const COLOR_BG = 0x33333d;
const COLOR_ROOM = 0x4a4a58;
const COLOR_ROOM_CURRENT = 0xd4ac0d;
const COLOR_ROOM_CLEARED = 0x2c6b3f;
const COLOR_ROOM_REACHABLE = 0x4a7fc0;
const COLOR_ROOM_HIDDEN = 0x3d3d48;
const COLOR_CONN_VISIBLE = 0x8a8aa0;
const COLOR_CONN_PARTIAL = 0x5d5d70;
const COLOR_CONN_HIDDEN = 0x45454f;

/**
 * Cena de exploração do andar: renderiza salas e conexões em trilha vertical
 * (entrada embaixo, progride para cima — estilo Pokelike/Slay the Spire) e
 * trata clique para mover/entrar.
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
        if (this.scene.isActive()) this.safeRedraw();
      });
    });
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.cameras.main.setBackgroundColor(COLOR_BG);
    this.safeRedraw();
    // O mapa precisa reajustar a escala quando o canvas é redimensionado
    // (ex.: troca de aba, resize da janela), não só quando os dados mudam.
    this.scale.on('resize', () => this.safeRedraw());
  }

  private safeRedraw(): void {
    try {
      this.redraw();
    } catch (e) {
      console.error('[MapScene] erro ao desenhar o mapa:', e);
    }
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

    const depths = rooms.map(r => this.depth(r, entranceRow));
    const lanes = rooms.map(r => r.col);
    const maxDepth = Math.max(0, ...depths);
    const minLane = Math.min(0, ...lanes);
    const maxLane = Math.max(0, ...lanes);

    // Escala o mapa inteiro para caber no canvas disponível — nunca corta
    // nem exige scroll; só amplia até MAX_SCALE quando há espaço de sobra.
    const contentW = (maxLane - minLane) * NODE_W + PAD * 2;
    const contentH = maxDepth * NODE_H + PAD * 2;
    const canvasW = this.scale.width || 640;
    const canvasH = this.scale.height || 480;
    const scale = Math.min(MAX_SCALE, canvasW / contentW, canvasH / contentH);

    const offsetX = (canvasW - (maxLane - minLane) * NODE_W * scale) / 2;
    // Entrada (depth 0) fica perto da base; profundidade cresce para cima.
    const baseY = canvasH - PAD * scale;

    const getX = (room: DungeonRoom) => offsetX + (room.col - minLane) * NODE_W * scale;
    const getY = (room: DungeonRoom) => baseY - this.depth(room, entranceRow) * NODE_H * scale;

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
        this.graphics.lineStyle(Math.max(1, 2 * scale), color, 1);
        this.graphics.lineBetween(getX(room), getY(room), getX(dest), getY(dest));
      });
    });

    // Salas
    const r = R * scale;
    rooms.forEach(room => {
      const x = getX(room);
      const y = getY(room);
      const container = this.add.container(x, y);

      const fillColor = !room.isVisible ? COLOR_ROOM_HIDDEN
        : room.isCurrent ? COLOR_ROOM_CURRENT
        : room.cleared ? COLOR_ROOM_CLEARED
        : isReachable(room) ? COLOR_ROOM_REACHABLE
        : COLOR_ROOM;

      const circle = this.add.circle(0, 0, r, fillColor, 1).setStrokeStyle(Math.max(1, 2 * scale), 0x000000, 0.4);
      container.add(circle);

      const isTypeRevealed = room.entered || room.cleared
        || (current?.connections.includes(room.id) ?? false);

      const iconText = room.isVisible
        ? (room.cleared ? '🏕️' : (isTypeRevealed ? ROOM_ICONS[room.type] : '?'))
        : '?';
      const icon = this.add.text(0, 0, iconText, { fontSize: `${Math.round(14 * scale)}px` }).setOrigin(0.5);
      container.add(icon);

      if (room.isVisible) {
        const labelText = isTypeRevealed ? ROOM_LABELS[room.type] : '???';
        const label = this.add.text(0, r + 10 * scale, labelText, { fontSize: `${Math.max(7, Math.round(8 * scale))}px`, color: '#aaa' }).setOrigin(0.5);
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
