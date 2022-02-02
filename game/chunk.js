import * as common from "./common.js";
import { generateChunk } from "./gen.js";

export default class Chunk {
  constructor(size = 32, height = 128, worker) {
    this.size = size;
    this.height = height;
    const rSize = new Array(size).fill();
    const rHght = new Array(height).fill();
    this.blocks = rSize.map(() => rHght.map(() => rSize.map(() => null)));
    this.invalidateMesh();
    this._builder = new common.VoxelGeometryBuilder();
    if(worker) this.assignedWorker = worker;
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

  async _buildGeomWorker() {
    //todo replace with document.href or whatever
    const worker = new Worker('/game/chunkThread.js', { type: 'module' });
    const data = JSON.stringify(this.getRenderData());
    worker.postMessage({renderData: data});
    const transData = await (new Promise((resolve, reject) => {
      worker.addEventListener('message', event => {
        resolve(event.data.transData);
      }, {once: true});
    }));
    console.log('promiseResolved')
    const builder = this._builder;
    builder.loadTransferredData(transData);
    return builder.build();
  }

  _buildGeom() {
    const builder = this._builder;
    builder.reset();
    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.height; y++) {
        for (let z = 0; z < this.size; z++) {
          const here = this.fastGetBlock(x,y,z);
          if(here != null) {
            builder.put(x, y, z, {
              front:  !this.getBlock(x, y, z+1), //front; positive-z-side
              right:  !this.getBlock(x+1, y, z), //right; positive-x-side
              back:   !this.getBlock(x, y, z-1), //back;  negative-z-side
              left:   !this.getBlock(x-1, y, z), //left;  negative-x-side
              top:    !this.getBlock(x, y+1, z), //top;   positive-y-side
              bottom: !this.getBlock(x, y-1, z), //bottom;  negative-y-side
            }, here.uv);
          }
        }
      }
    }
    return builder.build();
  }

  async buildMesh(atlas) {
    console.log('buildMesh');
    if((!this.meshInvalidated) && this.cachedMesh) {
      console.log('cached');
      return this.cachedMesh;
    }
    this.meshInvalidated = false;
    
    const material = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      map: atlas,
      fog: true,
    });
    //(lightLevel * 255) + (lightLevel * 255) << 16 + (lightLevel * 255) << 32,
    //const material = new THREE.MeshBasicMaterial({color: 0,wireframe: true,side: THREE.DoubleSide});
    
    let geometry;
    if(this.assignedWorker) {
      geometry = await this._buildGeomWorker();
    } else {
      geometry = this._buildGeom();
    }

    const mesh = new THREE.Mesh(geometry, material);
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

  getRenderData() {
    let rd = [];
    for (let x = 0; x < this.size; x++) {
      let xr = [];
      rd.push(xr);
      for (let y = 0; y < this.height; y++) {
        let yr = [];
        xr.push(yr);
        for (let z = 0; z < this.size; z++) {
          const b = this.fastGetBlock(x,y,z);
          yr.push(b ? b.getRenderData() : 0);
        }
      }
    }
    return rd;
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