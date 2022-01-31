import * as common from "./common.js";

// Block class
export class Block {
  static name = 'null'
  static id = 'null';
  static texture = ''; 
  get name() { return this.constructor.name; }
  get id() { return this.constructor.id; }
  get texture() { return this.constructor.texture; }
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
  static name = 'Grass';
  static id = 'grass';
  //todo texture
}
builtIn.push(GrassBlock);


