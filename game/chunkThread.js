import * as common from './common.js';

addEventListener('message', event => {
  const rd = Array.from(event.data.renderData);
  console.log(`Got ${rd} Float32`);

  const size = rd.length;
  const height = rd[0].length;

  const isInRange = (x,y,z) => {
    return (x >= 0) && (x < size) && 
           (y >= 0) && (y < height) &&
           (z >= 0) && (z < size)
  }
  const getBlock = (x,y,z) => {
    if(!isInRange(x,y,z)) return;
    return rd[x][y][z];
  }

  const builder = new common.VoxelGeometryBuilder();
  
  let rdi = 0;
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < size; z++) {
        const isEmpty = rd[rdi] < 0;
        if(isEmpty) {
          rdi++;
        } else {
          const uv = rd.slice(rdi, 6*4);
          rdi += 6*4;
          builder.put(
            x,y,z,{
              front:  !getBlock(x, y, z+1), //front; positive-z-side
              right:  !getBlock(x+1, y, z), //right; positive-x-side
              back:   !getBlock(x, y, z-1), //back;  negative-z-side
              left:   !getBlock(x-1, y, z), //left;  negative-x-side
              top:    !getBlock(x, y+1, z), //top;   positive-y-side
              bottom: !getBlock(x, y-1, z), //bottom;  negative-y-side
            }, {
              front:  uv.slice(0, 4), //front; positive-z-side
              right:  uv.slice(4, 4), //right; positive-x-side
              back:   uv.slice(8, 4), //back;  negative-z-side
              left:   uv.slice(12,4), //left;  negative-x-side
              top:    uv.slice(16,4), //top;   positive-y-side
              bottom: uv.slice(20,4), //bottom;  negative-y-side
            } 
          )
        }
      }
    }
  }
  //send a last message...
  const transData = builder.getTransferrableData();
  postMessage({transData: transData}, [transData.buffer]);
  //..and then kys in 100ms
  //setTimeout(() => self.close(), 100);
});