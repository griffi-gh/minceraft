import * as common from "./common.js";
import { generateChunk } from "./gen.js";

export default class Chunk {
  constructor(size = 32, height = 128) {
    this.size = size;
    this.height = height;
    const rSize = new Array(size).fill();
    const rHght = new Array(height).fill();
    this.blocks = rSize.map(() => rSize.map(() => rHght.map(() => null)));
    this.invalidateMesh();
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
    if((!this.meshInvalidated) && this.cachedMesh) return this.cachedMesh;
    const vertices = [];
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        for (let z = 0; z < this.height; z++) {
          const here = this.getBlock(x,y,z);
          if(here != null) {
            common.cubeVert(
              vertices,
              (this.getBlock(x, y, z+1) != null), //front; positive-z-side
              (this.getBlock(x+1, y, z) != null), //right; positive-x-side
              (this.getBlock(x, y, z-1) != null), //back;  negative-z-side
              (this.getBlock(x-1, y, z) != null), //left;  negative-x-side
              (this.getBlock(x, y+1, z) != null), //top;   positive-y-side
              (this.getBlock(x, y-1, z) != null), //left;  negative-y-side
              x, y, z
            );
          }
        }
      }
    }
    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      wireframe: true,
      wireframeLinewidth: 2,
      side: THREE.DoubleSide,
      flatShading: true,
    });
    const geometry = common.buildGeom(vertices);
    const mesh = new THREE.Mesh(geometry, material);
    this.dirty = false;
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

  generate(blocks, x, y) {
    this.invalidateMesh();
    generateChunk(blocks, this, x, y);
    return this;
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
    this.invalidateMesh();
  }

  dispose() {
    if(this.cachedMesh) this.cachedMesh.dispose;
  }
}