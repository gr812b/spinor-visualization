import { EQUATIONS } from '../src/math/equations.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  complex, cMul, cConj, cAbs2, cAbs, cArg, fromPolar,
  complexMatrix, applyMatrix2, interpolateMultiplier,
} from '../src/math/complex.js';

function close(actual, expected, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) < tolerance,
    'Expected '+actual+' ≈ '+expected);
}
test('complex multiplication equals the matrix action for a range of signs and magnitudes', () => {
  const samples = [
    complex(0,0),complex(1,0),complex(0,1),complex(-1,0),
    complex(2,1),complex(-3,2),complex(.25,-.5),complex(5,-4),
  ];
  for(const z of samples) for(const w of samples) {
    const product=cMul(z,w);
    const transformed=applyMatrix2(complexMatrix(z),[w.re,w.im]);
    close(transformed[0],product.re);
    close(transformed[1],product.im);
  }
});
test('conjugation cancels the phase and gives squared magnitude',()=>{
  for(const z of [complex(2,1),complex(0,0),complex(-1,5),complex(.2,-.7)]) {
    const product=cMul(z,cConj(z));
    close(product.re,cAbs2(z));
    close(product.im,0);
  }
});
test('polar reconstruction and rotation scaling agree with multiplication',()=>{
  const factors=[complex(2,1),complex(-1,0),complex(0,-3),complex(.1,.5)];
  for(const z of factors){
    const rebuilt=fromPolar(cAbs(z),cArg(z));
    close(rebuilt.re,z.re);close(rebuilt.im,z.im);
    const input=complex(-2,3);
    const out=cMul(z,input);
    close(cAbs(out),cAbs(z)*cAbs(input));
  }
});
test('interpolation starts at identity and ends at exactly the target',()=>{
  for(const z of [complex(2,1),complex(-1,0),complex(0,0),complex(-3,-2)]){
    assert.deepEqual(interpolateMultiplier(z,0),complex(1,0));
    assert.deepEqual(interpolateMultiplier(z,1),z);
    for(const t of [.1,.25,.5,.75,.9]){
      const intermediate=interpolateMultiplier(z,t);
      close(cAbs(intermediate),1+t*(cAbs(z)-1));
      const m=complexMatrix(intermediate);
      const a=applyMatrix2(m,[1,0]),b=applyMatrix2(m,[0,1]);
      close(a[0]*b[0]+a[1]*b[1],0);
      close(Math.hypot(...a),Math.hypot(...b));
    }
  }
});

test('each displayed equation references actual shared implementations',()=>{
  for(const [id,eq] of Object.entries(EQUATIONS)){
    assert.ok(eq.expression && eq.why && eq.picture, id+' lacks an explanation');
    assert.ok(eq.functions?.length > 0, id+' lacks linked implementations');
    eq.functions.forEach(fn => assert.equal(typeof fn,'function'));
    assert.equal(eq.source,'src/math/complex.js');
  }
});
