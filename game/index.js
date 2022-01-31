import './lib/three.js';
import Stats from './lib/stats.js';

import * as common from './common.js';
import { BlockTypeManager } from './blocks.js';
import World from './world.js';

export default class Game extends common.EventSource {
  constructor() {
    super();

    // Create BlockTypeManager and load built in blocks
    this.manager = new BlockTypeManager().loadBuiltIn();

    // Init scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.x += 3;
    this.camera.position.y += 20;
    this.camera.position.z += 5;
    this.scene.add(this.camera);

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
    this.world = new World({});
    this.world.updateLoadedChunks(this.scene, this.manager, 0, 0, 2);

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
        if(btn.a) rx += .1;
        if(btn.d) rx -= .1;
        if(btn.e) this.camera.position.y += 0.1;
        if(btn.q) this.camera.position.y -= 0.1;
        if(btn.w) this.camera.translateZ(-.2);
        if(btn.s) this.camera.translateZ(.2);
        this.camera.rotation.set(0,0,0)
        this.camera.setRotationFromAxisAngle(new THREE.Vector3(0,1,0), rx)
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