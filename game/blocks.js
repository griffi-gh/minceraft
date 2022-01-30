
// Block class
export class Block {
  static id = 'null';
  get id() { return this.constructor.id; }
  static texture = ''; 
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
    this.blockuid = '0';
  }
  loadData(data, cat = ['save', 'local']) {
    cat.forEach(i => {
      try {
        if(data[i]) Object.assign(this.data[i], data[i]);
      } catch {}
    });
  }

  loadSave(data) {
    this.loadData({save: this.data.save})
  }
  getSavedData() {
    return {save: this.data.save}
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
    if(!(type instanceof Block)) {
      throw new Error('not a block',Block);
    }
    this.types.push(type);
    this.typesById[type.id] = type;
  }
  loadBuiltIn() {
    builtIn.forEach(v => this.addType(v));
    return this;
  }
}

// Built in blocks

class GrassBlock extends Block {
  static id = 'm-grass'
  //todo texture
}
builtIn.push(GrassBlock);


