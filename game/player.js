import Game from './index.js';
import * as common from './common.js';

export default class Player extends common.EventSource {
  constructor(options) {
    super();
    this.game = (options instanceof Game ? options : null) ??
                options.this ?? options.game;
    this.camera = options.camera ?? this.game.camera;
    this.scene = options.scene ?? this.game.scene;
    this.world = options.world ?? this.game.world;
  }
  initCameraSystem() {

  }
}