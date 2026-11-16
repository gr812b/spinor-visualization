import test from 'node:test';
import assert from 'node:assert/strict';
import { parseScalar } from '../src/math/parse-scalar.js';

test('supports fractions, signs, parentheses, pi, square roots and scientific notation', () => {
  const accepted = {
    '1/2': .5,
    '-3/4': -.75,
    'sqrt(2)/2': Math.SQRT1_2,
    '√(2)/2': Math.SQRT1_2,
    'pi/4': Math.PI / 4,
    'π/4': Math.PI / 4,
    '2*(1+1/2)': 3,
    '1e-3': .001,
    '-(1/2)': -.5,
    '1+2/3': 5/3,
  };
  for (const [input,expected] of Object.entries(accepted))
    assert.ok(Math.abs(parseScalar(input)-expected) < 1e-12, input);
});
test('rejects unsafe or invalid expressions rather than interpreting code', () => {
  for(const input of ['','1/0','1/(2-2)','sqrt(-1)','eval(1)','window.alert(1)',
    'Math.random()','2**4','3/','sqrt(2','Infinity','1__2','1 2']) {
    assert.throws(()=>parseScalar(input),undefined,input);
  }
});
