import * as common from "./common.js";
import { generateChunk } from "./gen.js";

export default class Chunk {
  constructor(size = 32, height = 128) {
    this.size = size;
    this.height = height;
    const rSize = new Array(size).fill();
    const rHght = new Array(height).fill();
    this.blocks = rSize.map(() => rHght.map(() => rSize.map(() => null)));
    this.invalidateMesh();
  }

  isInRange(x, y, z) {
    return (x >= 0) && (x < this.size) && 
           (y >= 0) && (y < this.height) &&
           (z >= 0) && (z < this.size)
  }
  setBlock(x, y, z, block) {
    if(this.isInRange(x, y, z)) {
      this.blocks[x][y][z] = block ?? null;
    }
    this.invalidateMesh();
  }
  getBlock(x, y, z) {
    if(this.isInRange(x, y, z)) {
      return (this.blocks[x][y][z] ?? null);
    }
    return undefined;
  }
  
  invalidateMesh() {
    this.meshInvalidated = true;
  }

  rebuildMesh() {
    this.invalidateMesh();
    return this.buildMesh();
  }
  buildMesh() {
    console.log('buildMesh');
    if((!this.meshInvalidated) && this.cachedMesh) {
      console.log('cached');
      return this.cachedMesh;
    }
    let vertices = [];
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.size; z++) {
          const here = this.getBlock(x,y,z);
          if(here != null) {
            common.cubeVert(
              vertices,
              !this.getBlock(x, y, z+1), //front; positive-z-side
              !this.getBlock(x+1, y, z), //right; positive-x-side
              !this.getBlock(x, y, z-1), //back;  negative-z-side
              !this.getBlock(x-1, y, z), //left;  negative-x-side
              !this.getBlock(x, y+1, z), //top;   positive-y-side
              !this.getBlock(x, y-1, z), //bottom;  negative-y-side
              x, y, z
            );
          }
        }
      }
    }
    const material = new THREE.MeshLambertMaterial({
      color: 0x408040,
    });
    /*const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      side: THREE.DoubleSide
    });*/
    const geometry = common.buildGeom(vertices);
    const mesh = new THREE.Mesh(geometry, material);
    this.meshInvalidated = false;
    if(this.cachedMesh) {
      try {
        this.cachedMesh.dispose();
      } catch(e) {
        console.error('cachedMesh.dispose(); failed');
        console.error(e);
      }
    }
    this.cachedMesh = mesh;
    return mesh.clone();
  }

  generate(blocks, x, z, seed) {
    this.invalidateMesh();
    generateChunk(blocks, this, x, z, seed);
    return this;
  }

  save() {
    const blockstates = [];
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.size; z++) {
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
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.size; z++) {
          const blockSaveData = blockstates[saveIndex]; //[block id, other save data ...]
          const newBlock = new blocks.getById(blockSaveData[0]);
          this.setBlock(x, y, z, newBlock);
          newBlock.load(blockSaveData);
          saveIndex++;
        }
      }
    }
    this.invalidateMesh();
  }

  dispose() {
    if(this.cachedMesh) this.cachedMesh.dispose();
  }
}