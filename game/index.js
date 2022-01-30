import './lib/three.js';
import * as common from './common.js';

export default class Game {
  constructor() {
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
    const onAnimationFrame = () => {
      this.render();
      requestAnimationFrame(onAnimationFrame);
    };
    requestAnimationFrame(onAnimationFrame);
    addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });

    // Test by adding a cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
    this._cube = new THREE.Mesh(geometry, material);
    this.scene.add(this._cube);
    this.camera.position.z = 5;
  }
  resize(w, h) {
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
  render() {
    this._cube.rotation.x += 0.01;
		this._cube.rotation.y += 0.01;
    this._cube.rotation.z += 0.01;
    this.renderer.render(this.scene, this.camera);
  }
}