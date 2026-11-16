// Shared readable 2×2 matrix renderer for all 2D demonstrations.
export function formatReal(n) {
  if(!Number.isFinite(n))return 'undefined';
  if(Math.abs(n)<1e-10) return '0';
  if(Math.abs(n)>=100000 || Math.abs(n)<.0001)return n.toExponential(3);
  return Number(n.toFixed(4)).toString();
}

export function renderMatrix2(target,matrix) {
  let root=target.querySelector('.matrix2');
  if(!root) {
    target.replaceChildren();
    root=document.createElement('div');
    root.className='matrix2';
    root.setAttribute('role','img');
    const grid=document.createElement('div');
    grid.className='matrix2-values';
    for(let index=0;index<4;index++) {
      const cell=document.createElement('span');
      cell.className='matrix2-value '+(index%2===0?'matrix-first-column':'matrix-second-column');
      grid.append(cell);
    }
    root.append(grid);
    target.append(root);
  }
  const cells=root.querySelectorAll('.matrix2-value');
  for(let row=0;row<2;row++)for(let col=0;col<2;col++) {
    cells[row*2+col].textContent=formatReal(matrix[row][col]);
  }
  root.setAttribute('aria-label','2 by 2 matrix: row one '+matrix[0].map(formatReal).join(', ')+
    '; row two '+matrix[1].map(formatReal).join(', '));
}
