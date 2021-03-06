import * as common from "./common.js";

//todo move to index
//todo append to current url
export const TEX_URL = 'game/assets/terrain.png';
export const TEX_UV_W = 1 / 32;
export const TEX_UV_H = 1 / 16;

// Block class
export class Block {
  static name = null;
  static id = null;
  static uv = null; 
  static material = 0;
  static breakable = true;
  static liquid = false;
  get name() { return this.constructor.name; }
  get id() { return this.constructor.id; }
  get uv() { return this.constructor.uv; }
  get material() { return this.constructor.material; }
  get breakable() { return this.constructor.breakable; }
  get liquid() { return this.constructor.liquid; }
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
      } catch(e) {
        console.error('assign error', e);
      }
    });
  }

  load(data) {
    //data[0] is only used in chunk load function
    this.loadData({save: data[1]});
  }
  save() {
    return [this.id, this.data.save];
  }

  getRenderData() {
    return [this.uv];
  }
}

// BlockTypeManager
const builtIn = [];
export class BlockTypeManager {
  constructor() {
    this.types = [];
    this.typesById = {}
  }
  addType(type) {
    if(!(type.prototype instanceof Block)) {
      throw new Error('not a block',Block);
    }
    this.types.push(type);
    this.typesById[type.id] = type;
  }
  getById(id) { return this.typesById[id]; }
  loadBuiltIn() {
    builtIn.forEach(v => this.addType(v));
    return this;
  }
}

// Built in blocks

class GrassBlock extends Block {
  static get name() { return 'Grass' }
  static get id() { return 'grass' }
  static get uv() { return {
    top:    common.uv( 2, 0, TEX_UV_W, TEX_UV_H),
    bottom: common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    left:   common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
    right:  common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
    front:  common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
    back:   common.uv( 3, 0, TEX_UV_W, TEX_UV_H),
  }}
}
builtIn.push(GrassBlock);

class DirtBlock extends Block {
  static get name() { return 'Dirt' }
  static get id() { return 'dirt' }
  static get uv() { return {
    top:    common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    bottom: common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    left:   common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    right:  common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    front:  common.uv(18, 1, TEX_UV_W, TEX_UV_H),
    back:   common.uv(18, 1, TEX_UV_W, TEX_UV_H),
  }}
}
builtIn.push(DirtBlock);

class GlassBlock extends Block {
  static get name() { return 'Glass' }
  static get id() { return 'glass' }
  static get material() { return 1 }
  static get noDrop() { return 1 }
  static get uv() { return {
    top:    common.uv(24, 4, TEX_UV_W, TEX_UV_H),
    bottom: common.uv(24, 4, TEX_UV_W, TEX_UV_H),
    left:   common.uv(24, 4, TEX_UV_W, TEX_UV_H),
    right:  common.uv(24, 4, TEX_UV_W, TEX_UV_H),
    front:  common.uv(24, 4, TEX_UV_W, TEX_UV_H),
    back:   common.uv(24, 4, TEX_UV_W, TEX_UV_H),
  }}
}
builtIn.push(GlassBlock);

class WaterBlock extends Block {
  static get name() { return 'Water' }
  static get id() { return 'water' }
  static get liquid() { return true }
  static get material() { return 1 }
  static get uv() { return {
    top:    common.uv(16, 11, TEX_UV_W, TEX_UV_H),
    bottom: common.uv(16, 11, TEX_UV_W, TEX_UV_H),
    left:   common.uv(16, 11, TEX_UV_W, TEX_UV_H),
    right:  common.uv(16, 11, TEX_UV_W, TEX_UV_H),
    front:  common.uv(16, 11, TEX_UV_W, TEX_UV_H),
    back:   common.uv(16, 11, TEX_UV_W, TEX_UV_H),
  }}
}
builtIn.push(WaterBlock);

class BedrockBlock extends Block {
  static get name() { return 'Bedrock' }
  static get id() { return 'bedrock' }
  static get breakable() { return false }
  static get uv() { return {
    top:    common.uv(0, 1, TEX_UV_W, TEX_UV_H),
    bottom: common.uv(0, 1, TEX_UV_W, TEX_UV_H),
    left:   common.uv(0, 1, TEX_UV_W, TEX_UV_H),
    right:  common.uv(0, 1, TEX_UV_W, TEX_UV_H),
    front:  common.uv(0, 1, TEX_UV_W, TEX_UV_H),
    back:   common.uv(0, 1, TEX_UV_W, TEX_UV_H),
  }}
}
builtIn.push(BedrockBlock);
