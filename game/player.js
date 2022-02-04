import Game from './index.js';
import * as common from './common.js';

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _vector = new THREE.Vector3(0, 0, 0);
const _matrix = new THREE.Matrix4();
const _raycaster = new THREE.Raycaster();

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
    this.hover = {
      active: false,
      place: new THREE.Vector3(0,0,0),
      break: new THREE.Vector3(0,0,0),
    }

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
    return this;
  }
  move(forward = 0, strafe = 0, vertical = 0) {
    if(forward || strafe) {
      _vector.set(1, 1, 1);
      _matrix.compose(this.position, this.rotation, _vector);
    }
    if(forward) {
			_vector.setFromMatrixColumn(_matrix, 0);
			_vector.crossVectors(common.VEC3_UP, _vector);
      this.position.addScaledVector( _vector, forward);
    }
    if(strafe) {
			_vector.setFromMatrixColumn(_matrix, 0);
			this.position.addScaledVector( _vector, strafe);
    }
    if(vertical) {
      this.position.y += vertical;
    }
    return this;
  }
  updateRaycast() {
    _euler.setFromQuaternion(this.rotation);
    //_raycaster.set(this.position, _euler);
    _raycaster.setFromCamera(common.VEC2_ZERO, this.camera)
    const intersects = _raycaster.intersectObjects(
      this.world.loadedChunks.map(v => v.sceneMesh),
      false //recursive
    );
    this.hover.active = !!intersects.length;
    if(intersects.length) {
      const intrs = intersects[0]; //intersection
      this.hover.place.set(
        Math.floor(intrs.point.x + intrs.face.normal.x * .5),
        Math.floor(intrs.point.y + intrs.face.normal.y * .5),
        Math.floor(intrs.point.z + intrs.face.normal.z * .5)
      );
      this.hover.break.set(
        Math.floor(intrs.point.x - intrs.face.normal.x * .5),
        Math.floor(intrs.point.y - intrs.face.normal.y * .5),
        Math.floor(intrs.point.z - intrs.face.normal.z * .5)
      );
    }
    return this;
  }
  updateIndicatorCube() {
    //todo some sort of animation?
    if(this.hover.active) {
      this.cube.position.set(
        this.hover.place.x + .5,
        this.hover.place.y + .5,
        this.hover.place.z + .5
      );
    } else {
      //nah if it works it works
      this.cube.position.set(0,-1000,0);
    }
    return this;
  }
  updateRaycastAndIndicatorCube() {
    return this.updateRaycast().updateIndicatorCube();
  }
  updateRaycastAndIndicatorCubeTask = () => {
    if(this.taskp) return this;
    this.taskp = true;
    this.game.onEvent('animation-frame', () => {
      this.updateRaycastAndIndicatorCube()
      this.taskp = false;  
    }, true);
    return this;
  }
  initControls() {
    if(this.controlsInited) return this;
    this.controlsInited = true;

    alert('Block placement and chunk loader are currently disabled');

    console.log('Init controls');

    //lock mouse on click
    this.game.onEvent('click', this.lockPointer.bind(this));

    this.game.onEvent('mousemove', event => {
      _euler.setFromQuaternion(this.rotation);
      _euler.y -= event.moveX * .003;
      _euler.x -= event.moveY * .003;
      _euler.x = Math.max(-common.PI_2, Math.min(common.PI_2, _euler.x))
      this.rotation.setFromEuler(_euler);
      this.updateRaycastAndIndicatorCubeTask()
          .syncCamera();
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
      if(moveForward || moveStrafe || moveVertical) {
        this.move(moveForward, moveStrafe, moveVertical)
            .updateRaycastAndIndicatorCubeTask()
            .syncCamera();
      }
    });

    this.game.onEvent('click', () => {
      const v = this.hover.break;
      this.world.setBlockAndUpdateMesh(v.x, v.y, v.z, null, this.scene);
      this.updateRaycastAndIndicatorCubeTask();
    })
    this.game.onEvent('click-r', () => {
      const v = this.hover.place;
      const Block = this.game.manager.getById('dirt'); //todo this.game.manager => this.blocks
      this.world.setBlockAndUpdateMesh(v.x, v.y, v.z, new Block(), this.scene);
      this.updateRaycastAndIndicatorCubeTask();
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