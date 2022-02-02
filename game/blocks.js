import * as common from "./common.js";

//todo move to index
//todo append to current url
export const TEX_URL = 'game/assets/terrain.png';
export const TEX_UV_W = 1 / 32;
export const TEX_UV_H = 1 / 16;

// Block class
export class Block {
  static name = 'null'
  static id = 'null';
  static uv = null; 
  get name() { return this.constructor.name; }
  get id() { return this.constructor.id; }
  get uv() { return this.constructor.uv; }
  //------------------------
  constructor() {
    //  _______________________________
    // | MOVABLE |  no  |  yes  |  yes |
    // |  SAVED  |  no  |  no   |  yes |
    // | COMPLEX |  yes |  yes  |  no  |
    //  ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
    // movable - copied when picked up or moved
    // saved - saved to the hdd and can be loaded back on the next session
    // complex - can store complex data
    // (non-complex data properties can only include nested 
    // objects, arrays and basic types: numbers and strings as
    // they are encoded using JSON)
    this.data = {
      temp: {}, 
      local: {},
      save: {}
    };
  }
  loadData(data, cat = ['save', 'local']) {
    cat.forEach(i => {
      try {
        if(data[i]) Object.assign(this.data[i], data[i]);
      } catch {}
    });
  }

  load(data) {
    //data[0] is only used in chunk load function
    this.loadData({save: data[1]});
  }
  save() {
    return [this.id, this.data.save];
  }

  getRenderData(manager) {
    const flatUv = [];
    for (const key of ['front','right','left','back','top','bottom']) {
      flatUv.push.apply(flatUv, this.uv[key]);
    }
    return flatUv;
  }
}

// BlockTypeManager
const builtIn = [];
export class BlockTypeManager {
  constructor() {
    this.types = [];
    this.typesById = {}
    this.typeIndexMap = {};
  }
  addType(type) {
    if(!(type.prototype instanceof Block)) {
      throw new Error('not a block',Block);
    }
    this.types.push(type);
    this.typesById[type.id] = type;
    this.typeIndexMap[type] = (this.types.length - 1);
  }
  getId(type) {
    return type.id;
  }
  getById(id) {
    return this.typesById[id];
  }
  getNumericId(type) {
    return this.typeIndexMap[type];
  }
  getByNumericId(nid) {
    return this.types[nid];
  }
  loadBuiltIn() {
    builtIn.forEach(v => this.addType(v));
    return this;
  }
}

// Built in blocks


class GrassBlock extends Block {
  static name = 'Grass';
  static id = 'grass';
  static uv = {
    top:    common.uv( 2, 0, TEX_UV_W, TEX_UV_H),
    bottom: common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    left:   common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
    right:  common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
    front:  common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
    back:   common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
  };
  //todo texture
}
builtIn.push(GrassBlock);

class DirtBlock extends Block {
  static name = 'Dirt';
  static id = 'dirt';
  static uv = {
    top:    common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    bottom: common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    left:   common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    right:  common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    front:  common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    back:   common.uv(18, 1, TEX_UV_W, TEX_UV_H),
  };
  //todo texture
}
builtIn.push(DirtBlock);