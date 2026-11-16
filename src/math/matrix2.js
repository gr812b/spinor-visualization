// Real 2×2 linear transformations. Coordinates are column vectors.
// Reuse applyMatrix2() and complexMatrix() from the shared complex module.
import { complexMatrix } from './complex.js';

export const IDENTITY2 = Object.freeze([[1,0],[0,1]]);

export function interpolateMatrix2(target, progress) {
  const t=Math.max(0,Math.min(1,progress));
  if(t===0) return [[1,0],[0,1]];
  if(t===1) return target.map(row=>[...row]);
  return target.map((row,i)=>row.map((value,j)=>(i===j?1-t:0)+t*value));
}
export function determinant2(M) {
  return M[0][0]*M[1][1]-M[0][1]*M[1][0];
}
export function isComplexMatrix2(M) {
  const [[a,b],[c,d]]=M;
  const tolerance=1e-10*Math.max(1,Math.abs(a),Math.abs(b),Math.abs(c),Math.abs(d));
  return Math.abs(a-d)<=tolerance && Math.abs(b+c)<=tolerance;
}
export function complexFromMatrix2(M) {
  if(!isComplexMatrix2(M)) return null;
  return { re:(M[0][0]+M[1][1])/2, im:(M[1][0]-M[0][1])/2 };
}
export function isSymmetricMatrix2(M) {
  const scale=Math.max(1,...M.flat().map(Math.abs));
  return Math.abs(M[0][1]-M[1][0])<1e-10*scale;
}

function unitDirection(x,y) {
  const r=Math.hypot(x,y);
  if(r===0)return null;
  x/=r;y/=r;
  // Stabilize display direction; a line's orientation is arbitrary.
  if(x<0 || (Math.abs(x)<1e-12 && y<0))return [-x,-y];
  return [x,y];
}
function eigenDirection(M,lambda) {
  const [a,b]=M[0],[c,d]=M[1];
  const row1=[a-lambda,b],row2=[c,d-lambda];
  const row=Math.hypot(...row1)>=Math.hypot(...row2)?row1:row2;
  return unitDirection(-row[1],row[0]);
}
export function realEigenstructure2(M) {
  const [[a,b],[c,d]]=M;
  const scale=Math.max(1,...M.flat().map(Math.abs));
  const tolerance=1e-11*scale*scale;
  const trace=a+d;
  const discriminant=(a-d)**2+4*b*c;
  if(discriminant < -tolerance)
    return {kind:'none',values:[],directions:[]};
  if(Math.abs(discriminant)<=tolerance) {
    const lambda=trace/2;
    if(Math.max(Math.abs(a-lambda),Math.abs(b),Math.abs(c),Math.abs(d-lambda))<=1e-10*scale)
      return {kind:'all',values:[lambda],directions:[]};
    return {kind:'one',values:[lambda],directions:[{value:lambda,vector:eigenDirection(M,lambda)}]};
  }
  const delta=Math.sqrt(Math.max(0,discriminant));
  const values=[(trace+delta)/2,(trace-delta)/2];
  return {kind:'two',values,directions:values.map(value=>({value,vector:eigenDirection(M,value)}))};
}
export function singularValues2(M) {
  const [[a,b],[c,d]]=M;
  const u=a*a+c*c, v=a*b+c*d, w=b*b+d*d;
  const largest=Math.sqrt(Math.max(0,(u+w+Math.hypot(u-w,2*v))/2));
  return [largest,largest===0?0:Math.abs(determinant2(M))/largest];
}
export function imageOfUnitCircle(M) {
  const singular=singularValues2(M);
  const scale=Math.max(1,...M.flat().map(Math.abs));
  if(singular[0]<=1e-12*scale)
    return {kind:'point',singularValues:singular,endpoint:[0,0]};
  if(singular[1]<=1e-12*scale) {
    const col0=[M[0][0],M[1][0]],col1=[M[0][1],M[1][1]];
    const col=Math.hypot(...col0)>=Math.hypot(...col1)?col0:col1;
    const len=Math.hypot(...col);
    const endpoint=col.map(value=>value*singular[0]/len);
    return {kind:'segment',singularValues:singular,endpoint};
  }
  const isRound=Math.abs(singular[0]-singular[1])<=1e-10*Math.max(1,singular[0]);
  return {kind:isRound?'circle':'ellipse',singularValues:singular};
}
// SVG applies [a c e; b d f] to column vectors. An ordinary matrix
// [[a,b],[c,d]] therefore uses SVG's matrix(a c b d 0 0) ordering.
export function svgLinearMatrix2(M) {
  return `matrix(${M[0][0]} ${M[1][0]} ${M[0][1]} ${M[1][1]} 0 0)`;
}
export function matrixFromComplexParts(re,im) {
  return complexMatrix({re,im});
}
