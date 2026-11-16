import { cAdd, cMul } from './math/complex.js';
export { complex, cAdd, cMul, cScale, cConj, cExp } from './math/complex.js';

// Spinor math utilities
const toRad = (d) => d * Math.PI/180;

export function basisRotationMatrix(thetaDeg, phiDeg) {
  // Return a unitary whose columns are basis vectors for the displayed direction.
  // The displayed direction uses a y-up spherical convention:
  // n = (sin(theta) cos(phi), cos(theta), sin(theta) sin(phi)).
  const th = toRad(thetaDeg), ph = toRad(phiDeg);
  const x = Math.sin(th) * Math.cos(ph);
  const y = Math.cos(th);
  const z = Math.sin(th) * Math.sin(ph);
  const alpha = Math.sqrt(Math.max(0, (1 + z) / 2));
  const denom = Math.sqrt(Math.max(1e-12, 2 * (1 + z)));
  const beta = { re: x / denom, im: y / denom };
  const alphaC = { re: alpha, im: 0 };
  const betaConjNeg = { re: -beta.re, im: beta.im };
  return [[alphaC, betaConjNeg], [beta, alphaC]];
}

export function applySU2(U, spinor){
  // U is 2x2 with complex entries {re,im}
  const a = cMul(U[0][0], spinor[0]);
  const b = cMul(U[0][1], spinor[1]);
  const c = cMul(U[1][0], spinor[0]);
  const d = cMul(U[1][1], spinor[1]);
  return [cAdd(a,b), cAdd(c,d)];
}

export function su2FromAxisAngle(thetaRad, axis){
  // axis: {x,y,z} normalized. Return SU(2) matrix representing rotation U = cos(θ/2) I - i sin(θ/2) n·σ
  const half = thetaRad/2;
  const cosH = Math.cos(half); const sinH = Math.sin(half);
  const nx = axis.x, ny = axis.y, nz = axis.z;
  const a = { re: cosH, im: -nz * sinH };
  const d = { re: cosH, im: nz * sinH };
  const off01 = { re: -ny * sinH, im: -nx * sinH };
  const off10 = { re: ny * sinH, im: -nx * sinH };
  return [[a, off01],[off10, d]];
}
