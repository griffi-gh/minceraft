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

export class VoxelGeometryBuilder {
  constructor() {
    this.pos = [];
    this.norm = [];
    this.uv = [];
    this.indexes = [];
    this.idxPtr = 0;
  }
  reset() {
    this.pos.length = 0;
    this.norm.length = 0;
    this.uv.length = 0;
    this.indexes.length = 0;
    this.idxPtr = 0;
  }
  _pushIndexes() {
    const i = this.idxPtr;
    this.indexes.push(i,i+1,i+2,i+2,i+1,i+3);
    this.idxPtr += 4;
  }
  put(x, y, z, sides) {
    //todo custom uvs
    if(sides.front) {
      this.pos.push(x,y,z+1, x+1,y,z+1, x,y+1,z+1, x+1,y+1,z+1);
      this.norm.push(0,0,1, 0,0,1, 0,0,1, 0,0,1);
      this.uv.push(0,0, 1,0, 0,1, 1,1);  
      this._pushIndexes();
    }
    if(sides.right) {
      this.pos.push(x+1,y,z+1, x+1,y,z, x+1,y+1,z+1, x+1,y+1,z);
      this.norm.push(1,0,0, 1,0,0, 1,0,0, 1,0,0);
      this.uv.push(0,0, 1,0, 0,1, 1,1);
      this._pushIndexes();
    }
    if(sides.back) {
      this.pos.push(x+1,y,z, x,y,z, x+1,y+1,z, x,y+1,z);
      this.norm.push(0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1);
      this.uv.push(0,0, 1,0, 0,1, 1,1);
      this._pushIndexes();
    }
    if(sides.left) {
      this.pos.push(x,y,z, x,y,z+1, x,y+1,z, x,y+1,z+1);
      this.norm.push(-1,0,0, -1,0,0, -1,0,0, -1,0,0);
      this.uv.push(0,0, 1,0, 0,1, 1,1);
      this._pushIndexes();
    }
    if(sides.top) {
      this.pos.push(x+1,y+1,z, x,y+1,z, x+1,y+1,z+1, x,y+1,z+1);
      this.norm.push(0,1,0, 0,1,0, 0,1,0, 0,1,0);
      this.uv.push(0,0, 1,0, 0,1, 1,1);
      this._pushIndexes();
    }
    if(sides.bottom) {
      this.pos.push(x+1,y,z+1, x,y,z+1, x+1,y,z, x,y,z);
      this.norm.push(0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0);
      this.uv.push(0,0, 1,0, 0,1, 1,1);
      this._pushIndexes();
    }
  }
  build() {
    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(this.pos);
    const norm = new Float32Array(this.norm);
    const uv = new Float32Array(this.uv);
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.setIndex(this.indexes);
    return geometry;
  }
}


//TODO
export const cubeVert = (pvert = [], front = true, right = true, back = true, left = true, top = true, bottom = true, x = 0, y = 0, z = 0) => {
  if((front + right + back + left + top + bottom) < 1) return;
  const vert = [];

  if(front){
    //front
    vert.push({ pos: [0, 0, 1], norm: [ 0,  0,  1], uv: [0, 0], });
    vert.push({ pos: [1, 0, 1], norm: [ 0,  0,  1], uv: [1, 0], });
    vert.push({ pos: [0, 1, 1], norm: [ 0,  0,  1], uv: [0, 1], });
    
    vert.push({ pos: [0, 1, 1], norm: [ 0,  0,  1], uv: [0, 1], });
    vert.push({ pos: [1, 0, 1], norm: [ 0,  0,  1], uv: [1, 0], });
    vert.push({ pos: [1, 1, 1], norm: [ 0,  0,  1], uv: [1, 1], });
  }
  
  if(right) {
    // right
    vert.push({ pos: [1, 0, 1], norm: [ 1,  0,  0], uv: [0, 0], });
    vert.push({ pos: [1, 0, 0], norm: [ 1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [1, 1, 1], norm: [ 1,  0,  0], uv: [0, 1], });
  
    vert.push({ pos: [1, 1, 1], norm: [ 1,  0,  0], uv: [0, 1], });
    vert.push({ pos: [1, 0, 0], norm: [ 1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [1, 1, 0], norm: [ 1,  0,  0], uv: [1, 1], });
  }
  if(back) {
    // back
    vert.push({ pos: [1, 0, 0], norm: [ 0,  0, -1], uv: [0, 0], });
    vert.push({ pos: [0, 0, 0], norm: [ 0,  0, -1], uv: [1, 0], });
    vert.push({ pos: [1, 1, 0], norm: [ 0,  0, -1], uv: [0, 1], });
  
    vert.push({ pos: [1, 1, 0], norm: [ 0,  0, -1], uv: [0, 1], });
    vert.push({ pos: [0, 0, 0], norm: [ 0,  0, -1], uv: [1, 0], });
    vert.push({ pos: [0, 1, 0], norm: [ 0,  0, -1], uv: [1, 1], });
  }
  if(left) {
    // left
    vert.push({ pos: [0, 0, 0], norm: [-1,  0,  0], uv: [0, 0], });
    vert.push({ pos: [0, 0, 1], norm: [-1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [0, 1, 0], norm: [-1,  0,  0], uv: [0, 1], });
  
    vert.push({ pos: [0, 1, 0], norm: [-1,  0,  0], uv: [0, 1], });
    vert.push({ pos: [0, 0, 1], norm: [-1,  0,  0], uv: [1, 0], });
    vert.push({ pos: [0, 1, 1], norm: [-1,  0,  0], uv: [1, 1], });
  }
  if(top) {
    // top
    vert.push({ pos: [1, 1, 0], norm: [ 0,  1,  0], uv: [0, 0], });
    vert.push({ pos: [0, 1, 0], norm: [ 0,  1,  0], uv: [1, 0], });
    vert.push({ pos: [1, 1, 1], norm: [ 0,  1,  0], uv: [0, 1], });
  
    vert.push({ pos: [1, 1, 1], norm: [ 0,  1,  0], uv: [0, 1], });
    vert.push({ pos: [0, 1, 0], norm: [ 0,  1,  0], uv: [1, 0], });
    vert.push({ pos: [0, 1, 1], norm: [ 0,  1,  0], uv: [1, 1], });
  }
  if(bottom) {
    // bottom
    vert.push({ pos: [1, 0, 1], norm: [ 0, -1,  0], uv: [0, 0], });
    vert.push({ pos: [0, 0, 1], norm: [ 0, -1,  0], uv: [1, 0], });
    vert.push({ pos: [1, 0, 0], norm: [ 0, -1,  0], uv: [0, 1], });
  
    vert.push({ pos: [1, 0, 0], norm: [ 0, -1,  0], uv: [0, 1], });
    vert.push({ pos: [0, 0, 1], norm: [ 0, -1,  0], uv: [1, 0], });
    vert.push({ pos: [0, 0, 0], norm: [ 0, -1,  0], uv: [1, 1], });
  }
  for(const vertex of vert) {
    vertex.pos[0] += x;
    vertex.pos[1] += y;
    vertex.pos[2] += z;
    pvert.push(vertex);
  }
  return pvert;
}
export function buildGeom(vert) {
  const positions = [];
  const normals = [];
  const uvs = [];
  for (const vertex of vert) {
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
    new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents)
  );
  geometry.setAttribute(
    'normal',
    new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents)
  );
  geometry.setAttribute(
    'uv',
    new THREE.BufferAttribute(new Float32Array(uvs), uvNumComponents)
  );
  return geometry;
}
