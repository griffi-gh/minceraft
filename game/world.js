import Chunk from "./chunk.js";
import * as common from "./common.js";

export default class World {
  constructor(options) {
    this.name = options.name ?? ('Unnamed-' + common.randomStr(5));
    this.chunkSize = options.chunkSize ?? 32;
    this.chunkHeight = options.chunkHeight ?? 128;
    this.saveData = {}; //custom save data, for mods;
    this.loadedChunks = [];
    this.seed = common.randomStr(16);
  }
  //TODO
  updateLoadedChunks(scene, blocks, xPos, zPos, renderDist, atlas, force){
    const x = Math.floor(xPos / this.chunkSize);
    const z = Math.floor(zPos / this.chunkSize);
    if((this.pX === x) && (this.pZ === z)) return;  
    console.log('Moved to ' + x + ',' + z)
    this.pX = x;
    this.pZ = z;

    const removed = [];
    const seen = {};
    let changed = false;
    if(this.loadedChunks.length) {
      this.loadedChunks = this.loadedChunks.filter(v => {
        const keep = !((Math.abs(v.x - x) > renderDist) || (Math.abs(v.z - z) > renderDist));
        if(keep) {
          seen[common.getPosKey(v.x,v.z)] = true;
        } else {
          changed = true;
          if(v.dispose) v.dispose();
          removed.push(v);
        }
        return keep;
      });
    }
    const needed = {};
    if(changed || (!this.loadedChunks.length)) {
      for(let ix = -renderDist; ix <= renderDist; ix++) {
        for(let iz = -renderDist; iz <= renderDist; iz++) {
          const ax = ix + x;
          const az = iz + z;
          const pkey = common.getPosKey(ax,az);
          if(seen[pkey]) continue;
          this.loadedChunks.push({
            chunk: new Chunk(this.chunkSize, this.chunkHeight).generate(
              blocks, ax * this.chunkSize, az * this.chunkSize, 
              this.seed
            ),
            x: ax, z: az,
          });
          needed[pkey] = true;
        }
      }
      this.updateLoadedChunkMeshes(scene, atlas, needed, removed);
    }
    return this;
  }
  updateLoadedChunkMeshes(scene, atlas, needed = this.loadedChunks, removed = []) {
    for(const v of removed) {
      scene.remove(v.sceneMesh);
    }
    let t = 0;
    for(const v of this.loadedChunks) {
      if(needed[common.getPosKey(v.x,v.z)]) {
        setTimeout(() => {
          const mesh = v.chunk.buildMesh(atlas);
          mesh.position.set(this.chunkSize * v.x, 0, this.chunkSize * v.z);
          scene.add(mesh);
          v.sceneMesh = mesh;
        }, t);
        t += 16.6;
      }
    }
    //scene.add(new THREE.BoxHelper(this.sceneMeshes[0], 0xffff00));
  }
  //todo
  save() {}
  load() {}
}