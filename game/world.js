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
  }
  //TODO
  updateLoadedChunks(scene, blocks, x, y, renderDist){
    if(this.loadedChunks.length) return;
    this.loadedChunks.push({
      chunk: new Chunk(this.chunkSize, this.chunkHeight).generate(blocks, 0, 0),
      x: 0, y: 0,
    });
    this.updateLoadedChunkMeshes(scene);

    /* TODO

    for(const chunk of this.loadedChunks) {
      if(distance > )
      try {
        scene.remove(chunk.mesh);
      } catch(e) {
        console.error('failed to remove chunk mesh from "scene"');
        console.error(e);
      }
    }
    this.loadedChunks = [];
    for (let x = 0; x < visibleArea; x++) {
      for (let y = 0; y < visibleArea; y++) {
        this.loadedChunks =
      }
    }*/
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