import * as common from "./common.js";

export default class Chunk {
  constructor(size = 32, height = 128) {
    this.size = size;
    this.height = height;
    const rSize = new Array(size).fill();
    const rHght = new Array(height).fill();
    this.blocks = rSize.map(() => rSize.map(() => rHght.map(() => null)));
  }

  isInRange(x, y, z) {
    return (x >= 0) && (x < this.size) && 
           (y >= 0) && (y < this.size) &&
           (z >= 0) && (z < this.height)
  }
  setBlock(x, y, z, block) {
    if(this.isInRange(x, y, z)) {
      this.blocks[x][y][z] = block ?? null;
    }
  }
  getBlock(x, y, z) {
    if(this.isInRange(x, y, z)) {
      return (this.blocks[x][y][z] ?? null);
    }
    return undefined;
  }
  
  buildMesh() {
    
    
  }

  save() {
    const blockstates = [];
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.height; z++) {
          const block = this.blocks[x][y][z];
          if(block === null) {
            blockstates.push(0);
          } else {
            blockstates.push(block.save());
          }
        }
      }
    }
    return blockstates;
  }
  load(data, blocks) {
    /*chunk size is stored in the world save*/ 
    const blockstates = data[0];
    let saveIndex = 0;
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.height; z++) {
          const blockSaveData = blockstates[saveIndex]; //[block id, other save data ...]
          const newBlock = new blocks.getById(blockSaveData[0]);
          this.setBlock(x, y, z, newBlock);
          newBlock.load(blockSaveData);
          saveIndex++;
        }
      }
    }
  }
}