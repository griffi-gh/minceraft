export const VEC2_ONE = new THREE.Vector2(1, 1);
export const VEC3_ONE = new THREE.Vector3(1, 1, 1);
export const VEC2_ZERO = new THREE.Vector2(0, 0);
export const VEC3_ZERO = new THREE.Vector3(0, 0, 0);
export const VEC3_UP = new THREE.Vector3(0, 1, 0);
export const PI_2 = Math.PI / 2;

export class EventSource extends Object {
  constructor(...args) {
    super(...args);
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
    if(!arr) throw new Error(`Failed to trigger "${name}" - event doesn't exist`)
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
    return this;
  }
  offEvent(name, callback) {
    name = String(name);
    const callbacks = this._callbacks;
    callbacks[name] = callbacks[name].filter(v => (v !== callback));
    return this;
  }

  clearEventListeners(name) {
    if(name == null) {
      this._callbacks = {};
    } else {
      this.createEvent(name);
    }
  }

  //sugary stuff
  async awaitEvent(name) {
    return (await new Promise(resolve => {
      return this.onEvent(name, (...args) => {
        resolve(args);
      }, true);
    }));
  }
  addEventLisener(name, callback, options = {once: false}) {
    this.onEvent(name, callback, options.once);
  }
  removeEventListener(name, callback) {
    this.offEvent(name, callback);
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

export function getPosKey(x,y) {
  return `${x.toString()}$${y.toString()}`;
}

export function mod(a, b) {
  return ((a % b) + b) % b;
}

export function uv(x,y,w,h) {
  return [
    x * w,
    1 - ((y + 1) * h), // 0,0
    (x + 1) * w,
    1 - ((y + 1) * h), // 1,0
    x * w,
    1 - (y * h),       // 0,1
    (x + 1) * w,
    1 - (y * h),       // 1,1
  ]
}

export class VoxelGeometryBuilder {
  constructor() {
    this.pos = [];
    this.norm = [];
    this.uv = [];
    this.indexes = [];
    this.groups = [];
    this.reset();
  }
  reset() {
    this.pos.length = 0;
    this.norm.length = 0;
    this.uv.length = 0;
    this.indexes.length = 0;
    this.groups.length = 0;

    this.idxPtr = 0;
    
    this.grPtr = 0;
    this.grPrevPtr = 0;
    this.grMat = 0;

    return this;
  }

  nextGroup() {
    this.groups.push([
      this.grPrevPtr,
      this.grPtr - this.grPrevPtr,
      this.grMat++
    ]);
    this.grPrevPtr = this.grPtr;
  }

  _pushIndexesCube() {
    const i = this.idxPtr;
    this.indexes.push(i, i+1, i+2, i+2, i+1, i+3);
    this.idxPtr = i+4;
    this.grPtr += 6;
  }
  putCube(x, y, z, sides, uv) {
    //todo custom uvs
    if(sides.front) {
      this.pos.push(x,y,z+1, x+1,y,z+1, x,y+1,z+1, x+1,y+1,z+1);
      this.norm.push(0,0,1, 0,0,1, 0,0,1, 0,0,1);
      this.uv.push.apply(this.uv, uv.front);  
      this._pushIndexesCube();
    }
    if(sides.right) {
      this.pos.push(x+1,y,z+1, x+1,y,z, x+1,y+1,z+1, x+1,y+1,z);
      this.norm.push(1,0,0, 1,0,0, 1,0,0, 1,0,0);
      this.uv.push.apply(this.uv, uv.right);  
      this._pushIndexesCube();
    }
    if(sides.back) {
      this.pos.push(x+1,y,z, x,y,z, x+1,y+1,z, x,y+1,z);
      this.norm.push(0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1);
      this.uv.push.apply(this.uv, uv.back);  
      this._pushIndexesCube();
    }
    if(sides.left) {
      this.pos.push(x,y,z, x,y,z+1, x,y+1,z, x,y+1,z+1);
      this.norm.push(-1,0,0, -1,0,0, -1,0,0, -1,0,0);
      this.uv.push.apply(this.uv, uv.left);  
      this._pushIndexesCube();
    }
    if(sides.top) {
      this.pos.push(x+1,y+1,z, x,y+1,z, x+1,y+1,z+1, x,y+1,z+1);
      this.norm.push(0,1,0, 0,1,0, 0,1,0, 0,1,0);
      this.uv.push.apply(this.uv, uv.top); 
      this._pushIndexesCube();
    }
    if(sides.bottom) {
      this.pos.push(x+1,y,z+1, x,y,z+1, x+1,y,z, x,y,z);
      this.norm.push(0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0);
      this.uv.push.apply(this.uv, uv.bottom); 
      this._pushIndexesCube();
    }
    return this;
  }
  
  build() {
    this.nextGroup();
    const geometry = new THREE.BufferGeometry();
    const pos = new Float32Array(this.pos);
    const norm = new Float32Array(this.norm);
    const uv = new Float32Array(this.uv);
    geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(norm, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geometry.setIndex(this.indexes);
    this.groups.forEach(group => geometry.addGroup.apply(geometry, group));
    return geometry;
  }
}
