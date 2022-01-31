export function generateChunk(blocks, chunk, chunkX, chunkY) {
  const Grass = blocks.getById('grass');
  for (let x = 0; x < chunk.size; x++) {
    for (let y = 0; y < chunk.size; y++) {
      for (let z = 0; z < 4; z++) {
        chunk.setBlock(x, y, z, new Grass());
      }
    }
  }
}