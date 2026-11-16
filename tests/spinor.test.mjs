import test from 'node:test';
import assert from 'node:assert/strict';
import { complex, cAdd, cScale, cMul, cConj, cExp, cAbs2 } from '../src/math/complex.js';
import { basisRotationMatrix } from '../src/operators-v2.js';
import {
 PAULI, matDag, matApply, matMul, spinorNorm2, normalizeSpinor,
 expectation, defaultToZBasis, spinExpectationVectorFromDefaultBasis,
 magneticFieldHamiltonian, magneticEvolutionOperator, evolveInField, fieldDirection,
} from '../src/math/spinor.js';

function near(a,b,tol=1e-10) {
  assert.ok(Math.abs(a-b)<tol, a+' ≉ '+b);
}
function nearComplex(a,b,tol=1e-10){near(a.re,b.re,tol);near(a.im,b.im,tol);}
function nearMatrix(a,b,tol=1e-10) {
  for(let i=0;i<2;i++) for(let j=0;j<2;j++) nearComplex(a[i][j],b[i][j],tol);
}
const state=normalizeSpinor([complex(.7,.2),complex(-.3,.5)]);

test('spinor normalization and Pauli expectations are consistent',()=>{
  near(spinorNorm2(state),1);
  near(expectation([complex(1,0),complex(0,0)],PAULI.z).re,1);
  near(expectation([complex(0,0),complex(1,0)],PAULI.z).re,-1);
  near(expectation([complex(1/Math.SQRT2,0),complex(1/Math.SQRT2,0)],PAULI.x).re,1);
  for(const op of Object.values(PAULI)){
    near(expectation(state,op).im,0);
  }
});
test('refactored Bloch expectation matches original ±y basis conversion',()=>{
  const a=state[0],b=state[1],inv=1/Math.sqrt(2);
  const alpha={
    re:(a.re+b.re)*inv,im:(a.im+b.im)*inv,
  };
  const beta={
    re:(-a.im+b.im)*inv,im:(a.re-b.re)*inv,
  };
  const originalAlphaBeta={
    re:alpha.re*beta.re+alpha.im*beta.im,
    im:alpha.re*beta.im-alpha.im*beta.re,
  };
  const original={
    x:2*originalAlphaBeta.re,
    y:2*originalAlphaBeta.im,
    z:cAbs2(alpha)-cAbs2(beta),
  };
  const result=spinExpectationVectorFromDefaultBasis(state);
  near(result.x,original.x);
  near(result.y,original.y);
  near(result.z,original.z);
  near(cAbs2(defaultToZBasis(state)[0])+cAbs2(defaultToZBasis(state)[1]),1);
});
test('basis transformations are unitary and invert under adjoint',()=>{
  const I=[[complex(1),complex(0)],[complex(0),complex(1)]];
  for(const theta of [0,45,90,130,180])for(const phi of [0,37,90,200]){
    const U=basisRotationMatrix(theta,phi);
    nearMatrix(matMul(matDag(U),U),I);
    const transformed=matApply(matDag(U),state);
    near(spinorNorm2(transformed),1);
  }
});
test('magnetic operator and evolution match the original phase implementation',()=>{
  const I=[[complex(1),complex(0)],[complex(0),complex(1)]];
  const B=2.75,dt=.12,theta=71,phi=114;
  const U=basisRotationMatrix(theta,phi);
  const oldCoeffs=matApply(matDag(U),state);
  const oldResult=normalizeSpinor(matApply(U,[
    cMul(cExp(-B*dt/2),oldCoeffs[0]),cMul(cExp(B*dt/2),oldCoeffs[1]),
  ]));
  const latest=evolveInField(state,B,theta,phi,dt);
  latest.forEach((part,i)=>nearComplex(part,oldResult[i]));
  const evolution=magneticEvolutionOperator(B,theta,phi,dt);
  nearMatrix(matMul(matDag(evolution),evolution),I);
  const H=magneticFieldHamiltonian(B,theta,phi);
  nearMatrix(matDag(H),H);
  // W(t) = I - i H t + O(t²) for ħ=1.
  const epsilon=1e-6;
  const tiny=magneticEvolutionOperator(B,theta,phi,epsilon);
  for(let row=0;row<2;row++)for(let col=0;col<2;col++){
    const actual=cScale(cAdd(tiny[row][col],cScale(I[row][col],-1)),1/epsilon);
    const expected=cMul(complex(0,-1),H[row][col]);
    nearComplex(actual,expected,5e-6);
  }
});
test('renderer field-angle conversion preserves its existing axis convention',()=>{
  let n=fieldDirection(0,20);
  near(n.x,0);near(n.y,1);near(n.z,0);
  n=fieldDirection(90,0);
  near(n.x,0);near(n.y,0);near(n.z,-1);
  for(const theta of [0,30,90,180])for(const phi of [0,40,220]){
    n=fieldDirection(theta,phi);
    near(Math.hypot(n.x,n.y,n.z),1);
  }
});
