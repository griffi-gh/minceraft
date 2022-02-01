import './lib/three.js';
import Stats from './lib/stats.js';

import * as common from './common.js';
import { BlockTypeManager, TEX_URL } from './blocks.js';
import World from './world.js';

export default class Game extends common.EventSource {
  constructor(_options = {}) {
    super();
    // Default options
    this.options = {}
    this.options.renderDist = _options.renderDist ?? 2;
    this.options.chunkSize = _options.chunkSize ?? 32;
    this.options.chunkHeight = _options.chunkHeight ?? 128;
  }
  async init() {
    // Create BlockTypeManager and load built in blocks
    this.manager = new BlockTypeManager().loadBuiltIn();

    // Init scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x80CCCC);
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.x += 3;
    this.camera.position.y += 20;
    this.camera.position.z += 5;
    this.scene.add(this.camera);

    // Load atlas
    this.textures = {};
    await new Promise((resolve, reject) => {
      new THREE.TextureLoader().load(
        TEX_URL,
        texture => {
          this.textures.atlas = texture;
          resolve();
        }, undefined, reject
      );
    });
    //this.textures.atlas.anisotropy = 0;
    this.textures.atlas.magFilter = THREE.NearestFilter;
    this.textures.atlas.minFilter = THREE.NearestFilter;
    this.textures.atlas.premultiplyAlpha = true;
    this.textures.atlas.generateMipmaps = true;

    // Add light source
    {
      const hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
      hemiLight.position.set( 0, 500, 0 );
      this.scene.add( hemiLight );
      const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
      dirLight.position.set( -1, 0.75, 1 );
      dirLight.position.multiplyScalar( 50);
      this.scene.add( dirLight );
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = dirLight.shadow.mapSize.height = 2048;
      const d = 300;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.camera.far = 3500;
      dirLight.shadow.bias = -0.0001;
    }

    // Init game root DOM element
    this.gameElement = document.createElement('div');
    this.gameElement.classList.add('game-root-element')
    document.body.appendChild(this.gameElement);

    // Init renderer and add it to DOM
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.domElement.classList.add('game-canvas');
    this.gameElement.appendChild(this.renderer.domElement);

    // Init stats
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.gameElement.appendChild(this.stats.dom);

    // Set up callbacks
    this.createEvents('animation-frame', 'render-pre', 'render', 'render-post', 'resize');

    // Render callback
    let ptime = 0;
    const onAnimationFrame = time => {
      this.stats.begin();
      const delta = time - ptime;
      ptime = time;
      this.triggerEvent('animation-frame', delta);
      this.triggerEvent('render-pre', delta);
      this.triggerEvent('render', delta);
      this.triggerEvent('render-post', delta);
      this.render(delta); // render() MUST be called after events
      requestAnimationFrame(onAnimationFrame);
      this.stats.end();
    };
    requestAnimationFrame(onAnimationFrame);

    // Resize callback
    addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.triggerEvent('resize', w, h);
    });
    this.onEvent('resize', this.onResize.bind(this));

    //Create a new world
    this.world = new World({
      chunkSize: this.options.chunkSize,
      chunkHeight: this.options.chunkHeight,
    }).updateLoadedChunks(
      this.scene, this.manager, 0, 0, 
      this.options.renderDist, this.textures.atlas
    );

    //move camera on press
    //TODO vertical rotation
    //TODO KB events
    {
      const btn = {};
      document.body.addEventListener('keydown', event => {
        console.log(event.key)
        btn[event.key] = true;
      });
      document.body.addEventListener('keyup', event => {
        btn[event.key] = false;
      });
      let rx = 0;
      let ry = 0;
      this.onEvent('animation-frame', () => {
        let wupd;
        if(btn.a) rx += .1;
        if(btn.d) rx -= .1;
        if(btn.e) this.camera.position.y += 0.1;
        if(btn.q) this.camera.position.y -= 0.1;
        if(btn.w) this.camera.translateZ(btn.Shift ? -1000 : -.2);
        if(btn.s) this.camera.translateZ(btn.Shift ? 320000 : .2);
        this.camera.rotation.set(0,0,0)
        this.camera.setRotationFromAxisAngle(new THREE.Vector3(0,1,0), rx);
        this.world.updateLoadedChunks(
          this.scene, this.manager, 
          this.camera.position.x, this.camera.position.z,
          this.options.renderDist, this.textures.atlas
        );
      });
    }

    //DEBUG
    {}
  }
  onResize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  render(dt) {
    this.renderer.render(this.scene, this.camera);
  }
}