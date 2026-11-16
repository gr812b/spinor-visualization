// Shared complex-number arithmetic. All demos and spinor operators use this module.
// Numbers are plain objects { re, im }; angles are radians.
export function complex(re, im = 0) { return { re, im }; }
export function cAdd(a, b) { return complex(a.re + b.re, a.im + b.im); }
export function cScale(a, k) { return complex(a.re * k, a.im * k); }
export function cMul(a, b) {
  return complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
}
export function cConj(a) { return complex(a.re, -a.im); }
export function cAbs2(a) { return a.re * a.re + a.im * a.im; }
export function cAbs(a) { return Math.hypot(a.re, a.im); }
export function cArg(a) { return Math.atan2(a.im, a.re); }
export function cExp(angle) { return complex(Math.cos(angle), Math.sin(angle)); }
export function fromPolar(radius, angle) {
  return complex(radius * Math.cos(angle), radius * Math.sin(angle));
}

// The real 2x2 matrix representing multiplication by a complex number.
export function complexMatrix(z) {
  return [[z.re, -z.im], [z.im, z.re]];
}
export function applyMatrix2(matrix, point) {
  return [
    matrix[0][0] * point[0] + matrix[0][1] * point[1],
    matrix[1][0] * point[0] + matrix[1][1] * point[1],
  ];
}

// A pedagogical animation path: interpolate radius and angle, not matrix entries.
// The intermediate operation is always a rotation plus uniform scaling.
// Note that 0 has no defined argument; the angle of its collapse is arbitrary.
export function interpolateMultiplier(target, progress) {
  const t = Math.max(0, Math.min(1, progress));
  if (t === 0) return complex(1, 0);
  if (t === 1) return complex(target.re, target.im);
  const radius = 1 + (cAbs(target) - 1) * t;
  return fromPolar(radius, cArg(target) * t);
}
