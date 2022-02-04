import Game from './index.js';
import * as common from './common.js';

const PI_2 = Math.PI / 2;
const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _vector = new THREE.Vector3(0, 0, 0);

export default class Player extends common.EventSource {
  constructor(options, _options) {
    super();
    const isGameInstance = options instanceof Game;
    this.game = (isGameInstance ? options : null) ??
                options.this ?? options.game;
    if(isGameInstance) options = _options ?? {};
    this.camera = options.camera ?? this.game.camera;
    this.scene = options.scene ?? this.game.scene;
    this.world = options.world ?? this.game.world;
    this.position = options.position ? (
                      new THREE.Vector3(
                        options.position.x,
                        options.position.y,
                        options.position.z
                      )
                    ) : new THREE.Vector3(0,22,0);
    this.rotation = new THREE.Quaternion();
    this.rotation.setFromEuler(new THREE.Euler(0, 0, 0, 'YXZ'));
    this.speed = options.speed ?? .005;
    this.syncCamera();
    if(options.controls ?? true) this.initControls();
  }
  syncCamera() {
    if(!this.camera) return this;
    const p = this.position;
    this.camera.position.set(p.x, p.y, p.z);
    this.camera.rotation.setFromQuaternion(this.rotation)
    return this;
  }
  lockPointer() {
    console.log('Reqesting pointer lock')
    const e = this.game.gameElement;
    try {
      (
        e.requestPointerLock ?? 
        e.mozRequestPointerLock ??
        e.webkitRequestPointerLock ?? 
        (() => {throw new Error('Isn\'t supported')})
      ).call(e);
    } catch(e) { 
      console.error('Failed to lock the pointer: ', e);
    }
  }
  move(forward = 0, strafe = 0) {
    //TODO remove dependency on synced camera
    if(forward || strafe) this.syncCamera();
    if(forward) {
			_vector.setFromMatrixColumn(this.camera.matrix, 0);
			_vector.crossVectors(this.camera.up, _vector);
      this.position.addScaledVector( _vector, forward);
    }
    if(strafe) {
			_vector.setFromMatrixColumn(this.camera.matrix, 0);
			this.position.addScaledVector( _vector, strafe);
    }
  }
  initControls() {
    if(this.controlsInited) return this;
    this.controlsInited = true;

    alert('Block placement and chunk loader are currently disabled');

    console.log('Init controls');

    //lock mouse on click
    this.game.onEvent('click', () => {
      this.lockPointer();
    });
    
    this.game.onEvent('mousemove', event => {
      _euler.setFromQuaternion(this.rotation);
      _euler.y -= event.moveX * .003;
      _euler.x -= event.moveY * .003;
      _euler.x = Math.max(-PI_2, Math.min(PI_2, _euler.x))
      this.rotation.setFromEuler(_euler);
      this.syncCamera();
    })

    this.game.onEvent('key-loop', (keys, dt) => {
      let spd = this.speed * dt;
      let moveForward = 0;
      let moveStrafe = 0;
      let moveVertical = 0;
      if(keys.ShiftLeft) { spd *= 2.33; }
      if(keys.AltLeft) { moveVertical -= spd; }
      if(keys.Space) { moveVertical += spd; }
      if(keys.KeyW) { moveForward += spd; }
      if(keys.KeyS) { moveForward -= spd; }
      if(keys.KeyA) { moveStrafe -= spd; }
      if(keys.KeyD) { moveStrafe += spd; }
      this.move(moveForward, moveStrafe);
      this.position.y += moveVertical;
      this.syncCamera();
    })

    //highlight cube
    const geometry = new THREE.BoxGeometry(1,1,1);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.MeshBasicMaterial({
      color: 0x808080,
    });
    material.linewidth = 2;
    this.cube = new THREE.LineSegments(edges, material);
    this.scene.add(this.cube);

    return this;
  }
}