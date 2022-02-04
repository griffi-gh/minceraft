import './lib/three.js';
import Stats from './lib/stats.js';

import * as common from './common.js';
import { BlockTypeManager, TEX_URL } from './blocks.js';
import World from './world.js';
import Player from './player.js';

export default class Game extends common.EventSource {
  constructor(_options = {}) {
    super();
    // Default options
    this.options = {}
    this.options.renderDist = _options.renderDist ?? 2;
    this.options.chunkSize = _options.chunkSize ?? 32;
    this.options.chunkHeight = _options.chunkHeight ?? 128;
  }
  initEvents() {
    this.createEvents('animation-frame', 'render-pre', 'render', 'render-post');
    this.createEvents('resize');
    this.createEvents('mousemove', 'click', 'click-r');
    this.createEvents('keydown', 'keyup', 'keypress', 'key-loop');
    console.log('inited event groups');
  }
  initEventTriggers() {
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

    // Mouse callbacks
    //mousemove
    let prevX = null;
    let prevY = null;
    this.gameElement.addEventListener('mousemove', event => {
      event.stopPropagation();
      const x = event.clientX;
      const y = event.clientY;
      const diffX = (x - (prevX ?? x));
      const diffY = (x - (prevY ?? y));
      prevX = x;
      prevY = y;
      const moveX = event.movementX ??
                    event.mozMovementX ?? 
                    event.webkitMovementX ?? 
                    diffX ?? 0;
      const moveY = event.movementY ??
                    event.mozMovementY ??
                    event.webkitMovementY ?? 
                    diffY ?? 0;
      this.triggerEvent('mousemove', {x, y, moveX, moveY, event});
    });
    //click
    this.gameElement.addEventListener('mousedown', event => {
      event.stopPropagation();
      event.preventDefault();
      if((event.button === 2) || (event.button === 0)) {
        this.triggerEvent(
          (event.button === 2) ? 'click-r' : 'click', 
          {
            x: event.clientX,
            y: event.clientY,
            event
          }
        );
      }
    });
    // Keyboard callbacks
    //keyup
    const getKeyEventObj = event => ({
      key: event.code,
      input: event.key,
      ctrl: event.ctrlKey,
      shift: event.shiftKey,
      event: event
    });
    const keysDown = {};
    addEventListener('keydown', event => {
      event.preventDefault();
      event.stopPropagation();
      if(event.repeat) return;
      const obj = getKeyEventObj(event);
      this.triggerEvent('keydown', obj);
      keysDown[obj.key] = true;
    })
    addEventListener('keyup', event => {
      event.preventDefault();
      event.stopPropagation();
      if(event.repeat) return;
      const obj = getKeyEventObj(event);
      this.triggerEvent('keyup', obj);
      keysDown[obj.key] = false;
    });
    addEventListener('keypress', event => {
      event.preventDefault();
      event.stopPropagation();
      if(event.repeat) return;
      this.triggerEvent('keypress', getKeyEventObj(event));
    });
    this.onEvent('animation-frame', dt => {
      this.triggerEvent('key-loop', keysDown, dt)
    })

    console.log('Inited events')
  }
  async init() {
    this.initEvents();

    // Create BlockTypeManager and load built in blocks
    this.manager = new BlockTypeManager().loadBuiltIn();

    // Init scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x80CCCC);
    // - Add camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.x += 3;
    this.camera.position.y += 20;
    this.camera.position.z += 5;
    this.scene.add(this.camera);
    
    // - Add light source
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
    this.textures.atlas.anisotropy = 2;
    this.textures.atlas.magFilter = THREE.NearestFilter;
    this.textures.atlas.minFilter = THREE.NearestFilter;
    this.textures.atlas.premultiplyAlpha = true;
    this.textures.atlas.generateMipmaps = true;

    // Init stats
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.gameElement.appendChild(this.stats.dom);

    //Create a new world
    this.world = new World({
      chunkSize: this.options.chunkSize,
      chunkHeight: this.options.chunkHeight,
      atlas: this.textures.atlas
    }).updateLoadedChunks(
      this.scene, this.manager, 0, 0, 
      this.options.renderDist
    );
    
    //Init a player
    this.player = new Player(this);

    // Init events and assign them
    this.initEventTriggers();
    this.onEvent('resize', this.onResize.bind(this));
    this.onEvent('render-post', this.render.bind(this));
  }
  onResize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  render() {
    this.renderer.render(this.scene, this.camera);
  }
}