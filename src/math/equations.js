import { cMul, complexMatrix, applyMatrix2, cAbs, cArg, fromPolar, cConj, cAbs2, interpolateMultiplier } from './complex.js';

// Human-facing explanations reference the exact named math functions used in demos.
// There is no second implementation of the same numerical formulas here.
export const EQUATIONS = Object.freeze({
  "complex-product": {
    title: "Complex multiplication",
    expression: "(a + bi)(u + vi) = (au − bv) + (av + bu)i",
    why: "Distribute the brackets, then replace i² with −1. The output has two real coordinates.",
    picture: "Multiplication moves every point in the plane by the same rotation and uniform scale.",
    symbols: "a, b: multiplier coordinates; u, v: input coordinates; i² = −1.",
    functions: [cMul], source: "src/math/complex.js",
    visual: "multiply",
  },
  "matrix-action": {
    title: "Matrix acting on a point",
    expression: "[[a, −b], [b, a]] · [u, v]ᵀ = [au − bv, bu + av]ᵀ",
    why: "Row-by-column multiplication reproduces both coordinates of the complex product.",
    picture: "The first matrix column is where (1,0) goes; the second is where (0,1) goes.",
    symbols: "A 2×2 matrix transforms a 2-coordinate input into a 2-coordinate output.",
    functions: [complexMatrix, applyMatrix2], source: "src/math/complex.js",
    visual: "matrix",
  },
  "polar-form": {
    title: "Magnitude and angle",
    expression: "z = r(cos θ + i sin θ),    r = √(a² + b²),    θ = atan2(b, a)",
    why: "A point can be specified either by its horizontal/vertical coordinates or by distance and direction.",
    picture: "Multiplication by z scales every length by r and rotates every direction by θ.",
    symbols: "r ≥ 0; θ is measured counterclockwise from the positive real axis.",
    functions: [cAbs, cArg, fromPolar], source: "src/math/complex.js",
    visual: "polar",
  },
  "conjugate": {
    title: "Conjugate and magnitude squared",
    expression: "z̄ = a − bi,    z z̄ = a² + b² = |z|²",
    why: "The imaginary cross-terms cancel. Conjugation reflects across the real axis.",
    picture: "Multiplying a number by its conjugate cancels the rotation and leaves a positive real scale.",
    symbols: "The bar denotes conjugation; |z| is nonnegative length.",
    functions: [cConj, cMul, cAbs2], source: "src/math/complex.js",
    visual: "conjugate",
  },
  "animation-path": {
    title: "Animated rotation and scaling",
    expression: "w(t) = r(t)[cos(tθ) + i sin(tθ)],    r(t) = 1 + t(r − 1)",
    why: "At t=0 the multiplier is 1 (nothing changes); at t=1 it equals the chosen z.",
    picture: "The grid turns and uniformly resizes instead of shearing. This is a chosen animation path, not a physical law.",
    symbols: "0 ≤ t ≤ 1; r and θ are the target multiplier's magnitude and argument.",
    functions: [interpolateMultiplier], source: "src/math/complex.js",
    visual: "polar",
  },
});

export const DEMOS = Object.freeze([
  {
    id: "complex-multiplication",
    title: "Complex multiplication",
    category: "Complex numbers · Linear algebra",
    href: "complex-multiplication.html",
    summary: "Type any complex number and watch it rotate and scale the Cartesian grid.",
    equationIds: ["complex-product", "matrix-action", "polar-form", "conjugate", "animation-path"],
  },
  {
    id: "spinor",
    title: "Spinor visualization",
    category: "Quantum mechanics",
    href: "spinor.html",
    summary: "Explore two-component spinors, basis directions, and the magnetic-field animation.",
    equationIds: ["complex-product", "conjugate"],
  },
]);
