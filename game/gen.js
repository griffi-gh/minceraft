import SimplexNoise from './lib/simplex-noise.js';
import * as common from './common.js'

let lastSimplexNoise = {};
export function generateChunk(blocks, chunk, chunkX, chunkZ, seed) {
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
  for (let x = 0; x < chunk.size; x++) {
    for (let z = 0; z < chunk.size; z++) {
      const h = Math.floor((simplex.noise2D(x / 16, z / 16) * 0.5 + 0.5) * 10) + 10;
      for (let y = 0; y < h; y++) {
        chunk.setBlock(x, y, z, new Grass());
      }
    }
  }
}