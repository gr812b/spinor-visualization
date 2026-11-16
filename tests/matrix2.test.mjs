import test from 'node:test';
import assert from 'node:assert/strict';
import { complexMatrix, applyMatrix2 } from '../src/math/complex.js';
import {
  unitCirclePoint, interpolateMatrix2, determinant2, isComplexMatrix2,
  complexFromMatrix2, realEigenstructure2, singularValues2,
  imageOfUnitCircle, svgLinearMatrix2,
} from '../src/math/matrix2.js';

const near=(actual,expected,eps=1e-9)=>assert.ok(
  Math.abs(actual-expected)<eps,actual+' differs from '+expected);
function nearVector(a,b,eps=1e-9){
  near(a[0],b[0],eps);near(a[1],b[1],eps);
}
test('matrix animation interpolates every entry between identity and target',()=>{
  const M=[[2,1],[1,2]];
  assert.deepEqual(interpolateMatrix2(M,0),[[1,0],[0,1]]);
  assert.deepEqual(interpolateMatrix2(M,1),M);
  assert.deepEqual(interpolateMatrix2(M,.5),[[1.5,.5],[.5,1.5]]);
  for(const t of [0,.01,.1,.42,.6,.9,1]) {
    const A=interpolateMatrix2(M,t);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)
      near(A[i][j],(1-t)*(i===j?1:0)+t*M[i][j]);
  }
});
test('continuous SVG circle transform uses the exact 2×2 linear map',()=>{
  const targets=[
    [[2,1],[1,2]],[[1,1],[0,1]],[[0,-1],[1,0]],
    [[-1,0],[0,1]],[[0,0],[0,0]],[[1,0],[0,0]],
  ];
  for(const target of targets){
    for(const t of [0,.16,.38,.5,.79,1]){
      const M=interpolateMatrix2(target,t);
      const values=svgLinearMatrix2(M).match(/^matrix\(([^)]+)\)$/);
      assert.ok(values,'Invalid SVG affine transform syntax');
      const [a,b,c,d,e,f]=values[1].split(/\s+/).map(Number);
      for(let i=0;i<360;i++) {
        const point=unitCirclePoint(i*Math.PI/180);
        const svgResult=[a*point[0]+c*point[1]+e,b*point[0]+d*point[1]+f];
        nearVector(svgResult,applyMatrix2(M,point));
      }
    }
  }
});
test('symmetric matrix eigenvectors describe two exact fixed directions',()=>{
  const M=[[2,1],[1,2]];
  const eigen=realEigenstructure2(M);
  assert.equal(eigen.kind,'two');
  near(eigen.values[0],3);near(eigen.values[1],1);
  const [a,b]=eigen.directions;
  near(a.vector[0]*b.vector[0]+a.vector[1]*b.vector[1],0);
  for(const {value,vector} of eigen.directions) {
    const product=applyMatrix2(M,vector);
    nearVector(product,[value*vector[0],value*vector[1]]);
    // An intermediate identity-to-M matrix has identical eigendirections.
    for(const t of [.1,.4,.8]) {
      const intermediate=interpolateMatrix2(M,t);
      nearVector(applyMatrix2(intermediate,vector),
        [(1-t+t*value)*vector[0],(1-t+t*value)*vector[1]]);
    }
  }
});
test('general matrix eigenvectors may be nonorthogonal, repeated, or absent over the reals',()=>{
  const nonSymmetric=realEigenstructure2([[3,1],[0,1]]);
  assert.equal(nonSymmetric.kind,'two');
  for(const item of nonSymmetric.directions)
    nearVector(applyMatrix2([[3,1],[0,1]],item.vector),
      item.vector.map(v=>v*item.value));
  const jordan=realEigenstructure2([[1,1],[0,1]]);
  assert.equal(jordan.kind,'one');
  near(jordan.values[0],1);
  const rotation=realEigenstructure2([[0,-1],[1,0]]);
  assert.equal(rotation.kind,'none');
  assert.equal(rotation.directions.length,0);
  const scalar=realEigenstructure2([[3,0],[0,3]]);
  assert.equal(scalar.kind,'all');
  const zero=realEigenstructure2([[0,0],[0,0]]);
  assert.equal(zero.kind,'all');
});
test('unit circle maps to ellipse, circle, segment or point accurately',()=>{
  for(const [M,kind,axes,det] of [
    [[[2,1],[1,2]],'ellipse',[3,1],3],
    [[[0,-1],[1,0]],'circle',[1,1],1],
    [[[-1,0],[0,1]],'circle',[1,1],-1],
    [[[2,0],[0,0]],'segment',[2,0],0],
    [[[0,0],[0,0]],'point',[0,0],0],
  ]){
    const geo=imageOfUnitCircle(M);
    assert.equal(geo.kind,kind);
    near(geo.singularValues[0],axes[0]);
    near(geo.singularValues[1],axes[1]);
    near(determinant2(M),det);
    near(singularValues2(M)[0],axes[0]);
    if(kind==='segment')near(Math.hypot(...geo.endpoint),axes[0]);
  }
});
test('every complex multiplier embeds as a real matrix, but arbitrary matrices do not',()=>{
  for(const [a,b] of [[0,0],[1,0],[0,1],[-1,1],[.5,-.3]]) {
    const M=complexMatrix({re:a,im:b});
    assert.ok(isComplexMatrix2(M));
    const z=complexFromMatrix2(M);
    near(z.re,a);near(z.im,b);
    near(determinant2(M),a*a+b*b);
    const singular=singularValues2(M);
    near(singular[0],Math.hypot(a,b));
    near(singular[1],Math.hypot(a,b));
  }
  for(const M of [
    [[2,1],[1,2]],[[1,1],[0,1]],[[-1,0],[0,1]],
  ]) {
    assert.equal(isComplexMatrix2(M),false);
    assert.equal(complexFromMatrix2(M),null);
  }
});
