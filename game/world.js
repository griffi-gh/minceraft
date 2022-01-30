import * as common from "./common.js";

export default class World {
  constructor(options) {
    this.name = options.name ?? ('Unnamed-' + common.randomStr(5));
    this.chunkSize = options.chunkSize ?? 32;
    this.chunkHeight = options.chunkHeight ?? 128;
    this.saveData = {}; //custom save data, for mods;
    this.loadedChunks = [];
  }

  //todo
  save() {}
  load() {}
}