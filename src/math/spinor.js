// Pure spinor mathematics used by the existing visualization and equation catalog.
// Conventions match the original app: two-component column state and ħ = 1,
// with B controlling relative phase speed (not calibrated SI magnetic field units).
import { complex, cAdd, cMul, cConj, cScale, cAbs2, cExp } from './complex.js';
import { basisRotationMatrix } from '../operators-v2.js';

const zero = () => complex(0, 0);
const one = () => complex(1, 0);
export const PAULI = Object.freeze({
  x: [[zero(),one()],[one(),zero()]],
  y: [[zero(),complex(0,-1)],[complex(0,1),zero()]],
  z: [[one(),zero()],[zero(),complex(-1,0)]],
});
export function matDag(U) {
  return [[cConj(U[0][0]),cConj(U[1][0])],[cConj(U[0][1]),cConj(U[1][1])]];
}
export function matApply(U, state) {
  return [
    cAdd(cMul(U[0][0],state[0]),cMul(U[0][1],state[1])),
    cAdd(cMul(U[1][0],state[0]),cMul(U[1][1],state[1])),
  ];
}
export function matMul(A, B) {
  return [
    [cAdd(cMul(A[0][0],B[0][0]),cMul(A[0][1],B[1][0])),
     cAdd(cMul(A[0][0],B[0][1]),cMul(A[0][1],B[1][1]))],
    [cAdd(cMul(A[1][0],B[0][0]),cMul(A[1][1],B[1][0])),
     cAdd(cMul(A[1][0],B[0][1]),cMul(A[1][1],B[1][1]))],
  ];
}
export function spinorNorm2(state) { return cAbs2(state[0]) + cAbs2(state[1]); }
export function normalizeSpinor(state) {
  const norm = Math.sqrt(spinorNorm2(state)) || 1;
  return [cScale(state[0],1/norm),cScale(state[1],1/norm)];
}
export function expectation(state, operator) {
  const moved = matApply(operator,state);
  return cAdd(cMul(cConj(state[0]),moved[0]),cMul(cConj(state[1]),moved[1]));
}
export function defaultToZBasis(state) {
  // The existing app's basis uses ±y as its computational basis.
  // Preserve its established conversion before standard Pauli expectations.
  const inv = 1 / Math.sqrt(2);
  const [a,b] = state;
  return [
    cScale(cAdd(a,b),inv),
    cScale(cMul(complex(0,1),cAdd(a,cScale(b,-1))),inv),
  ];
}
export function spinExpectationVectorFromDefaultBasis(state) {
  const zBasis = defaultToZBasis(state);
  return {
    x: expectation(zBasis,PAULI.x).re,
    y: expectation(zBasis,PAULI.y).re,
    z: expectation(zBasis,PAULI.z).re,
  };
}
// H = (B/2) U σz U†. B is the effective angular-frequency parameter,
// so the physical sign and gyromagnetic ratio are not assumed here.
export function magneticFieldHamiltonian(magnitude, thetaDeg, phiDeg) {
  const U = basisRotationMatrix(thetaDeg,phiDeg);
  const H = matMul(matMul(U,PAULI.z),matDag(U));
  return H.map(row => row.map(value => cScale(value,magnitude/2)));
}
export function magneticEvolutionOperator(magnitude,thetaDeg,phiDeg,dt) {
  const U = basisRotationMatrix(thetaDeg,phiDeg);
  const halfPhase = magnitude * dt / 2;
  const D = [[cExp(-halfPhase),zero()],[zero(),cExp(halfPhase)]];
  return matMul(matMul(U,D),matDag(U));
}
export function evolveInField(state,magnitude,thetaDeg,phiDeg,dt) {
  return normalizeSpinor(matApply(magneticEvolutionOperator(magnitude,thetaDeg,phiDeg,dt),state));
}
export function fieldDirection(thetaDeg,phiDeg) {
  const th=thetaDeg*Math.PI/180, ph=phiDeg*Math.PI/180;
  // Match the existing renderer's lab-frame axis convention.
  return {
    x: Math.sin(th)*Math.sin(ph),
    y: Math.cos(th),
    z: -Math.sin(th)*Math.cos(ph),
  };
}
