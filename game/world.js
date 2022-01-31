import Chunk from "./chunk.js";
import * as common from "./common.js";

export default class World {
  constructor(options) {
    this.name = options.name ?? ('Unnamed-' + common.randomStr(5));
    this.chunkSize = options.chunkSize ?? 32;
    this.chunkHeight = options.chunkHeight ?? 128;
    this.saveData = {}; //custom save data, for mods;
    this.loadedChunks = [];
    this.sceneMeshes = [];
    this.seed = common.randomStr(16);
  }
  //TODO
  updateLoadedChunks(scene, blocks, x, z, renderDist){
    if(this.loadedChunks.length) return;
    this.loadedChunks.push({
      chunk: new Chunk(this.chunkSize, this.chunkHeight).generate(blocks, 0, 0, this.seed),
      x: 0, z: 0,
    });
    this.updateLoadedChunkMeshes(scene);

    /*
    // unload and get seen
    this.seen = {};
    this.loadedChunks = this.loadedChunks.filter(v => {
      const keep = !((Math.abs(v.x - x) > renderDist) || (Math.abs(v.y - y) > renderDist));
      if(keep) this.seen[`${v.x}$${v.y}`] = v;
      return keep;
    });
    for(let x = 0; x < renderDist; x++) {
      for(let z = 0; z < renderDist; z++) {
        const element = array[index];
      }
    }
    this.updateLoadedChunkMeshes(scene); */
  }
  updateLoadedChunkMeshes(scene) {
    this.sceneMeshes.forEach(v => {
      scene.remove(v);
      v.dispose();
    });
    this.loadedChunks.forEach(v => {
      const mesh = v.chunk.buildMesh();
      scene.add(mesh);
      this.sceneMeshes.push(mesh);
    });
    //scene.add(new THREE.BoxHelper(this.sceneMeshes[0], 0xffff00));
  }
  //todo
  save() {}
  load() {}
}