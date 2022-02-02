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
    this._builder = new common.VoxelGeometryBuilder();
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
  fastGetBlock(x,y,z) {
    return this.blocks[x][y][z];
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

  _chkSide(x, y, z, m) {
    const b = this.getBlock(x, y, z)
    if(b && (b.material > m)) return true;
    return !b;
  }

  //TODO use world to eliminate edges
  buildMesh(material, world) {
    console.log('buildMesh');
    if((!this.meshInvalidated) && this.cachedMesh) {
      console.log('cached');
      return this.cachedMesh;
    }
    const builder = this._builder;
    builder.reset();
    const cubeSides = {};
    for (let m = 0; m < material.length; m++) {
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.height; y++) {
          for (let z = 0; z < this.size; z++) {
            const here = this.fastGetBlock(x,y,z);
            if(here != null) {
              const hm = here.material
              if(hm !== m) continue;
              cubeSides.front  = this._chkSide(x, y, z+1, hm); //front; positive-z-side
              cubeSides.right  = this._chkSide(x+1, y, z, hm); //right; positive-x-side
              cubeSides.back   = this._chkSide(x, y, z-1, hm); //back;  negative-z-side
              cubeSides.left   = this._chkSide(x-1, y, z, hm); //left;  negative-x-side
              cubeSides.top    = this._chkSide(x, y+1, z, hm); //top;   positive-y-side
              cubeSides.bottom = this._chkSide(x, y-1, z, hm); //bottom;  negative-y-side
              builder.putCube(x, y, z, cubeSides, here.uv);
            }
          }
        }
      }
      if(m < (material.length - 1)) builder.nextGroup();
    }
    //(lightLevel * 255) + (lightLevel * 255) << 16 + (lightLevel * 255) << 32,
    //const material = new THREE.MeshBasicMaterial({color: 0,wireframe: true,side: THREE.DoubleSide});
    const geometry = builder.build();
    const mesh = new THREE.Mesh(geometry, material);
    this.meshInvalidated = false;
    if(this.cachedMesh) {
      try {
        this.cachedMesh.geometry.dispose();
      } catch(e) {
        console.error('cachedMesh.geometry.dispose(); failed');
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
    this.invalidateMesh();
    if(this.cachedMesh) {
      this.cachedMesh.geometry.dispose();
      this.cachedMesh = null;
    }
  }
}