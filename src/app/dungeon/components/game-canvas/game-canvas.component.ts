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
    :host { display: block; width: 100%; height: 100%; overflow: hidden; }
    .game-canvas-container { width: 100%; height: 100%; overflow: hidden; }
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
  private resizeObserver?: ResizeObserver;
  private resizeFrame?: number;
  private onBridgeResize = () => this.scheduleRefresh();

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
    this.bridge.events.on('resize', this.onBridgeResize);

    // O container muda de tamanho via layout flex do Angular (ex.: badge de chefão,
    // barra de ações), não por resize da janela — o listener padrão do Phaser
    // (window 'resize') nunca dispara nesse caso, deixando o canvas preso no
    // tamanho medido no instante exato da criação.
    this.resizeObserver = new ResizeObserver(() => this.scheduleRefresh());
    this.resizeObserver.observe(parent);
  }

  /**
   * Agenda o ajuste de tamanho no próximo frame em vez de rodar direto no
   * callback do ResizeObserver. Sem isso, redimensionar o canvas pode mudar
   * a altura do conteúdo o suficiente para exibir/ocultar a scrollbar do
   * `.game-center`, o que dispara o observer de novo — um loop de
   * redimensionamento que trava a página com o scroll oscilando sem parar.
   */
  private scheduleRefresh(): void {
    if (this.resizeFrame !== undefined) return;
    this.resizeFrame = requestAnimationFrame(() => {
      this.resizeFrame = undefined;
      this.refreshSize();
    });
  }

  private refreshSize(): void {
    if (!this.game) return;
    const parent = this.containerRef.nativeElement;
    const w = parent.clientWidth || 640;
    const h = parent.clientHeight || 480;
    // Não chama resize() se o tamanho não mudou de fato — evita realimentar
    // o loop acima quando o ResizeObserver dispara por uma mudança que não
    // afeta o conteúdo (ex.: scrollbar do próprio elemento observado).
    if (this.game.scale.width === w && this.game.scale.height === h) return;
    this.game.scale.resize(w, h);
  }

  ngOnDestroy(): void {
    this.bridge.events.off('resize', this.onBridgeResize);
    this.resizeObserver?.disconnect();
    if (this.resizeFrame !== undefined) cancelAnimationFrame(this.resizeFrame);
    this.game?.destroy(true);
    this.game = undefined;
  }
}
