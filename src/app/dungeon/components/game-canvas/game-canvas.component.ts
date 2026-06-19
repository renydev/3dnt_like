import {
  Component, ElementRef, Injector, Input, OnDestroy, ViewChild, AfterViewInit, inject,
} from '@angular/core';
import Phaser from 'phaser';
import { PhaserBridgeService } from '../../../core/services/phaser-bridge.service';

export interface GameSceneCtor {
  new (...args: any[]): Phaser.Scene;
}

/**
 * Host genérico de um Phaser.Game de cena única. Cada tela de jogo
 * (mapa, combate) instancia o seu próprio canvas com a cena correspondente;
 * a cena recebe o Injector do Angular em init() para resolver os services
 * de estado/regras diretamente, sem prop-drilling.
 */
@Component({
  selector: 'app-game-canvas',
  standalone: true,
  template: '<div #container class="game-canvas-container"></div>',
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .game-canvas-container { width: 100%; height: 100%; }
  `],
})
export class GameCanvasComponent implements AfterViewInit, OnDestroy {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;
  @Input({ required: true }) sceneClass!: GameSceneCtor;
  @Input() sceneKey = 'Scene';
  @Input() backgroundColor = '#07070f';

  private injector = inject(Injector);
  private bridge = inject(PhaserBridgeService);
  private game?: Phaser.Game;
  private onResize = () => this.game?.scale.refresh();

  ngAfterViewInit(): void {
    const parent = this.containerRef.nativeElement;

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: this.backgroundColor,
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: parent.clientWidth || 640,
        height: parent.clientHeight || 480,
      },
      scene: [this.sceneClass],
    });

    this.game.scene.start(this.sceneKey, { injector: this.injector });
    this.bridge.events.on('resize', this.onResize);
  }

  ngOnDestroy(): void {
    this.bridge.events.off('resize', this.onResize);
    this.game?.destroy(true);
    this.game = undefined;
  }
}
