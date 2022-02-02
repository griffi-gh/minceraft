import Chunk from "./chunk.js";
import * as common from "./common.js";

const NUM_WORKERS = 4;

export default class World {
  constructor(options) {
    this.name = options.name ?? ('Unnamed-' + common.randomStr(5));
    this.chunkSize = options.chunkSize ?? 32;
    this.chunkHeight = options.chunkHeight ?? 128;
    this.saveData = {}; //custom save data, for mods;
    this.loadedChunks = [];
    this.sceneMeshes = [];
    this.seed = common.randomStr(16);

    this.workers = [];
    for (let i = 0; i < NUM_WORKERS; i++) {
      const worker = new Worker('/game/chunkThread.js', { type: 'module' });
      this.workers.push(worker);
    }
    this.nextWorker = 0;
  }
  //TODO
  updateLoadedChunks(scene, blocks, xPos, zPos, renderDist, atlas, force){
    const x = Math.floor(xPos / this.chunkSize);
    const z = Math.floor(zPos / this.chunkSize);
    if((this.pX === x) && (this.pZ === z)) return;  
    console.log('Moved to ' + x + ',' + z)
    this.pX = x;
    this.pZ = z;

    const seen = {};
    let changed = false;
    if(this.loadedChunks.length) {
      this.loadedChunks = this.loadedChunks.filter(v => {
        const keep = !((Math.abs(v.x - x) > renderDist) || (Math.abs(v.z - z) > renderDist));
        if(keep) {
          seen[`${v.x}$${v.z}`] = true;
        } else {
          changed = true;
          if(v.dispose) v.dispose();
        }
        return keep;
      });
    }
    if(changed || (!this.loadedChunks.length)) {
      for(let ix = -renderDist; ix <= renderDist; ix++) {
        for(let iz = -renderDist; iz <= renderDist; iz++) {
          const ax = ix + x;
          const az = iz + z;
          if(seen[`${ax}$${az}`]) continue;
          this.loadedChunks.push({
            chunk: new Chunk(
              this.chunkSize, 
              this.chunkHeight,
              this.workers[this.nextWorker++]
            ).generate(
              blocks, 
              ax * this.chunkSize, 
              az * this.chunkSize, 
              this.seed
            ), x: ax, z: az,
          });
          if(this.nextWorker >= this.workers.length) this.nextWorker = 0;
        }
      }
      this.updateLoadedChunkMeshes(scene, atlas);
    }
    return this;
  }
  updateLoadedChunkMeshes(scene, atlas) {
    for(const v of this.sceneMeshes) {
      scene.remove(v);
      if(v.dispose) v.dispose();
    }
    for(const v of this.loadedChunks) {
      v.chunk.buildMesh(atlas).then(mesh => {
        mesh.position.set(this.chunkSize * v.x, 0, this.chunkSize * v.z);
        scene.add(mesh);
        this.sceneMeshes.push(mesh);
      });
    }
    //scene.add(new THREE.BoxHelper(this.sceneMeshes[0], 0xffff00));
  }
  //todo
  save() {}
  load() {}
}