# Math, seen

A growing, build-free interactive mathematics reference, starting from the original Spinor Visualization project.

## Pages
- `index.html` — directory of demos
- `complex-multiplication.html` — editable complex multiplier and point (fractions and radicals supported), 6.5-second grid animation (play/pause/scrub), zoom/pan/fit, matching product expansion and readable 2×2 matrix
- `matrix-transformation.html` — arbitrary real 2×2 matrices and complex multipliers as alternate inputs; an exactly transformed **continuous SVG unit circle**, draggable vectors, eigenvectors, zoom/pan/fit, and play/pause/scrub
- `spinor.html` — original spinor and 3D basis visualization, retained
- `equations.html` — shared equation reference

## Run locally
Serve the folder with any static server:

```sh
python -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000). ES module imports are most reliable when served rather than opened as `file://` URLs.

For mathematical tests, with Node 22 or newer:

```sh
npm test
```

No npm install, bundler, build, or backend is needed. The spinor visualization loads Three.js from an external CDN (and therefore needs internet); the complex grid demo has no external runtime dependency.

## Structure and extending the library

```
src/
  math/
    complex.js           # Single numeric source for complex operations
    parse-scalar.js      # Safe fraction and radical input parser
    matrix2.js           # Matrix interpolation, eigenvectors, determinant, ellipse geometry
    viewport.js          # Reusable screen/world mapping and zoom/fit calculations
    spinor.js            # Spinor normalization, matrices, field operator, evolution, precession
    equations.js         # Named equations, intuition, implementations, demo registry
  ui/
    navigation.js        # Sidebar across pages
    equation-library.js  # Reused expandable equation inspector and mini visuals
    matrix-display.js    # Shared bracketed matrices and column-vector typography
  demos/
    complex-multiplication.js
    matrix-transformation.js
  operators-v2.js        # Original spinor operations; imports shared complex arithmetic
  main-v2.js             # Original spinor UI
tests/
  complex.test.mjs       # Matrix/product equivalence, conjugation, polar, interpolation
  matrix2.test.mjs       # Unit-circle images, eigenvectors, singular values, SVG mappings
```

To add a demo:
1. Create a standalone HTML page using `site.css` and `src/ui/navigation.js`.
2. Reuse functions from `src/math/complex.js` (or create an appropriately scoped shared math module).
3. Add any new mathematical identities to `src/math/equations.js` with explanations, associated source functions, and visual hints.
4. Add one entry to the `DEMOS` registry and render `mountEquationLibrary()` with its `equationIds`.
5. Add tests for mathematical invariants rather than just screenshot appearance.

**Important:** The equation catalog is explanatory metadata, not a second numeric implementation. It identifies the functions that perform computations, while demos import those exact shared functions. If an equation changes, update the implementation, its explanation, and its tests together.

## Mathematical choices in the complex grid demo

Let `z = a + bi` and `w = u + vi`. The product is `zw = (au-bv) + (av+bu)i` and its real-plane matrix is `[[a,-b],[b,a]]`.

The *animation* intentionally goes from `1` to `z` by linearly interpolating the **magnitude** and **angle**, not by interpolating the matrix coefficients. This keeps every intermediate transformation a rotation plus uniform scale. It is a visualization choice, not a time-evolution law. For `z = 0`, the grid collapses; the argument of zero is undefined.

## Hosting

Because the site is static, you can host the folder with GitHub Pages, Caddy, or any static web server. Deep links are normal `.html` files; no router rewrite rules are required.

## Interaction notes
- The plot supports wheel zoom around the cursor, drag-to-pan, zoom buttons, reset view and fit-to-points. The multiplier is the **image of 1** (violet arrow); the image of `i` shows the second matrix column (teal).
- Presets include eighth-turn rotations (±45°). Inputs accept `1/2`, `-3/4`, `sqrt(2)/2`, `pi/4`, parentheses and arithmetic. The parser is deliberately restricted and never evaluates JavaScript.
- The equation library includes the actual two-component spinor operations, basis transformations, Pauli expectation, effective magnetic Hamiltonian and evolution (with `ħ=1`). The app's `B` parameter is not calibrated in teslas.

Tests additionally verify screen/world coordinate roundtrips, mouse-anchored zoom, plot fitting, spinor field evolution, and browser-script syntax. The mathematical CI checks do not replace a manual browser visual review.

## Mathematical choices in the matrix transformation demo

The input can be any real matrix `M=[[a,b],[c,d]]`, or a complex multiplier `a+bi` translated through the existing shared `complexMatrix` function. Both input modes control the **same** final matrix display and visualization.

The playhead uses the pedagogical path `M(t)=(1-t)I+tM`. Every frame transforms the *entire native SVG circle* via the full affine matrix `matrix(a c b d 0 0)`; the curve is not approximated by a finite polygon or by interpolating a few sample vectors. Singular maps explicitly render their mathematically correct line segment or point. The animation path is not unique: for instance, interpolating from `I` to `-I` passes through the zero matrix. The complex-multiplication demo continues to use polar interpolation instead.

The original unit circle and transformed curve share the same world-to-screen coordinate system. The violet and teal axes are the images of the standard basis vectors, and the gold handle selects a column vector on the original circle. Real eigendirections, when available, are lines through the origin satisfying `Mv=λv` and are unaffected by the identity-to-`M` interpolation. The displayed singular values are **ellipse semiaxis lengths**, not necessarily eigenvalue magnitudes; they coincide with magnitudes of eigenvalues for symmetric matrices. Reflection can preserve the shape of the unit circle without corresponding to multiplication by a complex number.

The new display components reuse the same 2×2 matrix renderer and 2×1 vector notation across demos. The project remains build-free; the matrix and complex circle demos have no browser-library dependency.
