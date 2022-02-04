import Chunk from "./chunk.js";
import * as common from "./common.js";

export default class World {
  constructor(options) {
    this.name = options.name ?? ('Unnamed-' + common.randomStr(5));
    this.chunkSize = options.chunkSize ?? 32;
    this.chunkHeight = options.chunkHeight ?? 128;
    this.saveData = {}; //custom save data, for mods;
    this.loadedChunks = [];
    this.loadedChunksMap = {};
    this.seed = common.randomStr(16);
    this.material = [
      new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: options.atlas,
      }),
      new THREE.MeshLambertMaterial({
        color: 0xffffff,
        map: options.atlas,
        transparent: true,
        side: THREE.DoubleSide
      }),
    ];
  }
  addLoadedChunk(x, z, chunk) {
    if(this.getChunk(x,z)) throw new Error('Chunk loaded twice');
    if(chunk.disposed) throw new Error('Can\'t add disposed chunk');
    const obj = {
      chunk, x: x, z: z,
    }
    this.loadedChunks.push(obj);
    this.loadedChunksMap[common.getPosKey(x, z)] = obj;
    return obj;
  }
  removeLoadedChunk(x, z, scene) {
    if((x.x != null) && (z == null)) {
      z = x.z;
      x = x.x;
    }
    const chunk = this.getChunk(x,z);
    if(!chunk) throw new Error('Chunk not loaded');
    try { 
      chunk.chunk.dispose();
      if(chunk.sceneMesh) chunk.sceneMesh.geometry.dispose();
      if(scene && chunk.sceneMesh) scene.remove(chunk.sceneMesh);
    } catch(e) { console.warn(e); }
    chunk.disposed = true;
    this.loadedChunks = this.loadedChunks.filter(v => (v !== chunk));
    this.loadedChunksMap[common.getPosKey(x, z)] = undefined;
    //console.log(`disposed ${x} ${z}`)
    return chunk;
  }
  getChunk(x, z) {
    return this.loadedChunksMap[common.getPosKey(x, z)];
  }
  getChunkByCoords(x,z) {
    return this.loadedChunksMap[common.getPosKey(
      Math.floor(x / this.chunkSize),
      Math.floor(z / this.chunkSize)
    )];
  }
  _getChunkAndCoords(x, y, z) {
    return {
      chunk: this.getChunk(
        Math.floor(x / this.chunkSize),
        Math.floor(z / this.chunkSize),
      ),
      x: Math.floor(common.mod(x, this.chunkSize)),
      y: Math.floor(y),
      z: Math.floor(common.mod(z, this.chunkSize)),
    }
  }
  setBlock(x, y, z, block) {
    const data = this._getChunkAndCoords(x, y, z);
    data.chunk.chunk.setBlock(data.x, data.y, data.z, block);
    return this;
  }
  setBlockAndUpdateMesh(x, y, z, block, scene) {
    const data = this._getChunkAndCoords(x, y, z);
    data.chunk.chunk.setBlock(data.x, data.y, data.z, block);
    this.updateChunkMesh(scene, data.chunk.x, data.chunk.z);
    return this;
  }
  getBlock(x, y, z) {
    const data = this._getChunkAndCoords(x, y, z);
    return data.chunk.chunk.getBlock(data.x, data.y, data.z);
  }
  //TODO
  updateLoadedChunks(scene, blocks, xPos, zPos, renderDist, force){
    const x = Math.floor(xPos / this.chunkSize);
    const z = Math.floor(zPos / this.chunkSize);
    if((!force) && (this.pX === x) && (this.pZ === z)) return;  
    this.pX = x;
    this.pZ = z;
    console.log('Moved to ' + x + ',' + z);
    
    const removed = [];
    const len = this.loadedChunks.length;
    if(len) {
      for (let i = (len - 1); i > 0; i--) {
        const v = this.loadedChunks[i];      
        const outOfRenderDist = (
          (Math.abs(v.x - x) > renderDist) || 
          (Math.abs(v.z - z) > renderDist)
        );
        if(outOfRenderDist) {
          this.removeLoadedChunk(v.x, v.z, scene);
          removed.push(v);
        }
      }
    }

    const needed = {};
    let loadedNew = false;
    if((!this.loadedChunks.length) || removed.length) {
      for(let ix = (x - renderDist); ix <= (x + renderDist); ix++) {
        for(let iz = (z - renderDist); iz <= (z + renderDist); iz++) {
          if(!this.getChunk(ix, iz)) {
            const chunk = new Chunk(
              this.chunkSize,
              this.chunkHeight
            ).generate(
              blocks, 
              ix * this.chunkSize,
              iz * this.chunkSize, 
              this.seed
            );
            this.addLoadedChunk(ix, iz, chunk);
            needed[common.getPosKey(ix, iz)] = true;
            loadedNew = true;
          }
        }
      }
    }

    if(loadedNew || removed.length) {
      this.updateLoadedChunkMeshes(scene, needed, removed);
    }

    return this;
  }
  updateLoadedChunkMeshes(scene, needed = this.loadedChunksMap, removed = []) {
    for(const v of removed) {
      try {
        v.chunk.dispose();
        if(v.sceneMesh) v.sceneMesh.geometry.dispose();
        v.sceneMesh = null;
        scene.remove(v.sceneMesh);
      } catch(e) { console.warn('Cant remove mesh??? Chunk has no assigned mesh???'); }
    }
    const cond = (v) => (!v.disposed) && (v.chunk.meshInvalidated || needed[common.getPosKey(v.x,v.z)]);
    for(const v of this.loadedChunks) {
      if(cond(v)) {
        //todo timeout
        if(cond(v)) {
          if(v.sceneMesh) {
            v.sceneMesh.geometry.dispose();
            scene.remove(v.sceneMesh);
          } 
          const mesh = v.chunk.buildMesh(this.material, this);
          mesh.position.set(this.chunkSize * v.x, 0, this.chunkSize * v.z);
          scene.add(mesh);
          v.sceneMesh = mesh;
        }
      }
    }
  }
  updateChunkMesh(scene, x, z) {
    const chnk = this.getChunk(x,z);
    if(chnk.disposed) return;
    scene.remove(chnk.sceneMesh); 
    chnk.sceneMesh.geometry.dispose();
    const mesh = chnk.chunk.buildMesh(this.material, this);
    mesh.position.set(this.chunkSize * chnk.x, 0, this.chunkSize * chnk.z);
    scene.add(mesh);
    chnk.sceneMesh = mesh;
  }
  //todo
  save() {}
  load() {}
}