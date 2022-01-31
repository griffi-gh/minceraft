export function generateChunk(blocks, chunk, chunkX, chunkY) {
  const Grass = blocks.getById('grass');
  for (let x = 0; x < chunk.size; x++) {
    for (let z = 0; z < chunk.size; z++) {
      const h = Math.floor(Math.random()*4) + 1;
      for (let y = 0; y < h; y++) {
        chunk.setBlock(x, y, z, new Grass());
      }
    }
  }
}