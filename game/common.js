export class EventSource extends Object {
  constructor(...args) {
    super();
    this._callbacks = {};
  }
  createEvent(name) {
    this._callbacks[String(name)] = [];
  }
  createEvents(...names) {
    names.forEach(v => this.createEvent(v));
  }
  triggerEvent(name, ...args) {
    name = String(name)
    const callbacks = this._callbacks;
    const arr = callbacks[name];
    let doFilter = false;
    for(const v of arr) {
      if(v[0]) {
        v[0](...args);
      }
      if(v[1]) {
        v[0] = null;
        doFilter = true;
      }
    }
    if(doFilter) callbacks[name] = arr.filter(v => v[0]);
  }
  onEvent(name, callback, once = false) {
    this._callbacks[String(name)].push([callback, once]);
  }
  offEvent(name, callback) {
    name = String(name);
    const callbacks = this._callbacks;
    callbacks[name] = callbacks[name].filter(v => (v !== callback));
  }
  clearEvents(name) {
    if(name == null) {
      this._callbacks = {};
    } else {
      this.createEvent(name);
    }
  }
}

export function call(fn, ...args) {
  fn(...args);
  return fn;
}

export function random(min, max) {
  return Math.random() * (max - min) + min;
}

// TODO replace
export function randomStr(len) {
  return random(0,parseInt('z'.repeat(len),36)).toString(36);
}


//UNUNSED CRAP
//TODO REMOVE

/*
{
  {
    const color = 0xFFFFFF;
    const intensity = 1;
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(-1, 2, 4);
    this.scene.add(light);
  }
  const vertices = common.buildCubeMesh();
  const positions = [];
  const normals = [];
  const uvs = [];
  for (const vertex of vertices) {
    positions.push(...vertex.pos);
    normals.push(...vertex.norm);
    uvs.push(...vertex.uv);
  }
  const geometry = new THREE.BufferGeometry();
  const positionNumComponents = 3;
  const normalNumComponents = 3;
  const uvNumComponents = 2;
  geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents));
  geometry.setAttribute(
      'normal',
      new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents));
  geometry.setAttribute(
      'uv',
      new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents));
  const makeInstance = (geometry, x) => {
    const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    cube.position.x = x;
    return cube;
  }
  makeInstance(geometry, 0);
  this.camera.position.z = 5;
}s
export const buildCubeMesh = (x, y, z, front, right, back, left, top, bottom) => {
  const vert = [];

  if(front){
    //front
    vert.push({ pos: [-1, -1,  1], norm: [ 0,  0,  1], uv: [0, 0], });
    vert.push({ pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], });
    vert.push({ pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], });
    
    vert.push({ pos: [-1,  1,  1], norm: [ 0,  0,  1], uv: [0, 1], });
    vert.push({ pos: [ 1, -1,  1], norm: [ 0,  0,  1], uv: [1, 0], });
    vert.push({ pos: [ 1,  1,  1], norm: [ 0,  0,  1], uv: [1, 1], });
  }
  
  if(right) {
    // right
    vert.push({ pos: [ 1, -1,  1], norm: [ 1,  0,  0], uv: [0, 0], });
    vert.push({ pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], });
  
    vert.push({ pos: [ 1,  1,  1], norm: [ 1,  0,  0], uv: [0, 1], });
    vert.push({ pos: [ 1, -1, -1], norm: [ 1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [ 1,  1, -1], norm: [ 1,  0,  0], uv: [1, 1], });
  }
  if(back) {
    // back
    vert.push({ pos: [ 1, -1, -1], norm: [ 0,  0, -1], uv: [0, 0], });
    vert.push({ pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], });
    vert.push({ pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], });
  
    vert.push({ pos: [ 1,  1, -1], norm: [ 0,  0, -1], uv: [0, 1], });
    vert.push({ pos: [-1, -1, -1], norm: [ 0,  0, -1], uv: [1, 0], });
    vert.push({ pos: [-1,  1, -1], norm: [ 0,  0, -1], uv: [1, 1], });
  }
  if(left) {
    // left
    vert.push({ pos: [-1, -1, -1], norm: [-1,  0,  0], uv: [0, 0], });
    vert.push({ pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], });
  
    vert.push({ pos: [-1,  1, -1], norm: [-1,  0,  0], uv: [0, 1], });
    vert.push({ pos: [-1, -1,  1], norm: [-1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [-1,  1,  1], norm: [-1,  0,  0], uv: [1, 1], });
  }
  if(top) {
    // top
    vert.push({ pos: [ 1,  1, -1], norm: [ 0,  1,  0], uv: [0, 0], });
    vert.push({ pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], });
    vert.push({ pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], });
  
    vert.push({ pos: [ 1,  1,  1], norm: [ 0,  1,  0], uv: [0, 1], });
    vert.push({ pos: [-1,  1, -1], norm: [ 0,  1,  0], uv: [1, 0], });
    vert.push({ pos: [-1,  1,  1], norm: [ 0,  1,  0], uv: [1, 1], });
  }
  if(bottom) {
    // bottom
    vert.push({ pos: [ 1, -1,  1], norm: [ 0, -1,  0], uv: [0, 0], });
    vert.push({ pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], });
    vert.push({ pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], });
  
    vert.push({ pos: [ 1, -1, -1], norm: [ 0, -1,  0], uv: [0, 1], });
    vert.push({ pos: [-1, -1,  1], norm: [ 0, -1,  0], uv: [1, 0], });
    vert.push({ pos: [-1, -1, -1], norm: [ 0, -1,  0], uv: [1, 1], });
  }
  return vert;
}
*/