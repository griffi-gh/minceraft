import { Block } from './blocks.js';

export default class Chunk {
  constructor(size) {
    const blocks = new Array(size).fill(null).map(() => new Array(size).fill(null));
    
  }
}