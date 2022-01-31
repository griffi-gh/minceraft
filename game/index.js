import './lib/three.js';

import * as common from './common.js';
import { BlockTypeManager } from './blocks.js';

export default class Game extends common.EventSource {
  constructor() {
    super();
    
    // Create BlockTypeManager and load built in blocks
    this.manager = new BlockTypeManager().loadBuiltIn();

    // Init scene
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

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

    // Set up callbacks
    this.createEvents('render-pre', 'render', 'render-post', 'resize');

    // Render callback
    let ptime = 0;
    const onAnimationFrame = time => {
      const delta = time - ptime;
      ptime = time;
      this.triggerEvent('render-pre', delta);
      this.triggerEvent('render', delta);
      this.triggerEvent('render-post', delta);
      this.render(delta); // render() MUST be called after events
      requestAnimationFrame(onAnimationFrame);
    };
    requestAnimationFrame(onAnimationFrame);

    // Resize callback
    addEventListener('resize', () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      this.triggerEvent('resize', w, h);
    });
    this.onEvent('resize', this.onResize.bind(this));

    //DEBUG
    {
      // Add cube
      //const material = new THREE.MeshPhongMaterial( { color: 0x008800 } );
      
      const material = new THREE.MeshStandardMaterial({
        color: 0x008800,
        wireframe: true,
        wireframeLinewidth: 2,
        side: THREE.DoubleSide,
        flatShading: true,
      });

      const geometry = common.buildGeom(
        common.cubeVert(
          common.cubeVert([],1,1,1,1,0,1),
          1,1,1,1,1,0,
          0,2,0
        )
      );
      //const geometry = common.buildGeom(common.cubeVert([], 1,1,1,1,0,1));

      const cube = new THREE.Mesh(geometry, material);
      this.scene.add( cube );
      this.camera.position.x += 3;
      this.camera.position.y += 2;
      this.camera.position.z += 5;
      this.camera.rotation.x -= .1;
      this.camera.rotation.y += .33;
      // Add light source
      const color = 0xFFFFFF;
      const intensity = 1;
      const light = new THREE.DirectionalLight(color, intensity);
      light.position.set(this.camera.position.x, this.camera.position.y, this.camera.position.z);
      this.scene.add(light);
    }
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