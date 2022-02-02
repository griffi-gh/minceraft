import SimplexNoise from './lib/simplex-noise.js';
import * as common from './common.js'

let lastSimplexNoise = {};
export function generateChunk(blocks, chunk, offsetX, offsetZ, seed) {
  let simplex;
  if(lastSimplexNoise.seed === seed) {
    simplex = lastSimplexNoise.simplex;
  } else {
    console.log('Init SimplexNoise for seed ' + seed);
    simplex = new SimplexNoise(seed);
    lastSimplexNoise.simplex = simplex;
    lastSimplexNoise.seed = seed;
  }
  const Grass = blocks.getById('grass');
  const Dirt = blocks.getById('dirt');
  const Glass = blocks.getById('glass');
  for (let x = 0; x < chunk.size; x++) {
    for (let z = 0; z < chunk.size; z++) {
      const h = Math.floor((simplex.noise2D((x + offsetX) / 16, (z + offsetZ) / 16) * 0.5 + 0.5) * 10) + 10;
      for (let y = 0; y < h; y++) {
        chunk.setBlock(x, y, z, (y === (h - 1)) ? new Grass() : new Dirt());
      }
      for (let y = 13; y >= h; y--) {
        if(!chunk.getBlock(x,y,z)) {
          chunk.setBlock(x, y, z, new Glass());
        }
      }
    }
  }
}