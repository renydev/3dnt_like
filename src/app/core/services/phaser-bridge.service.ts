import { Injectable } from '@angular/core';
import Phaser from 'phaser';

/**
 * Canal de eventos compartilhado entre Angular e as cenas Phaser.
 * Cenas resolvem GameStateService/CombatService diretamente via Injector
 * (passado em scene.init); este bridge cobre apenas o sentido inverso —
 * sinais que o lado Angular precisa empurrar para dentro do canvas
 * (ex.: redimensionamento do container) sem reimplementar lógica de jogo.
 */
@Injectable({ providedIn: 'root' })
export class PhaserBridgeService {
  readonly events = new Phaser.Events.EventEmitter();

  notifyResize(): void {
    this.events.emit('resize');
  }
}
