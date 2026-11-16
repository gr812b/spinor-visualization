// Safe arithmetic for human-friendly real inputs, no eval or Function constructor.
// Accepts fractions, decimals, parentheses, pi/π, sqrt(x)/√(x), and + - * /.
export function parseScalar(input) {
  const source = String(input).trim().replaceAll('π','pi').replaceAll('√','sqrt').replaceAll('−','-');
  if (!source || source.length > 100) throw new Error('Enter a number or fraction');
  const tokens = source.match(/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|sqrt|pi|[()+*/-]/g);
  if (!tokens || tokens.join('') !== source.replace(/\s+/g,'')) throw new Error('Use numbers, fractions, sqrt, pi and arithmetic');
  let cursor = 0;
  function primary() {
    const token = tokens[cursor++];
    if (token === '+') return primary();
    if (token === '-') return -primary();
    if (token === '(') {
      const value = sum();
      if (tokens[cursor++] !== ')') throw new Error('Missing closing parenthesis');
      return value;
    }
    if (token === 'sqrt') {
      if (tokens[cursor++] !== '(') throw new Error('Use sqrt(number)');
      const radicand = sum();
      if (tokens[cursor++] !== ')') throw new Error('Missing closing parenthesis');
      if (radicand < 0) throw new Error('Square root must be real');
      return Math.sqrt(radicand);
    }
    if (token === 'pi') return Math.PI;
    if (token && /^(?:\d|\.)/.test(token)) return Number(token);
    throw new Error('Expected a number');
  }
  function product() {
    let value = primary();
    while (tokens[cursor] === '*' || tokens[cursor] === '/') {
      const op = tokens[cursor++];
      const right = primary();
      if (op === '/' && right === 0) throw new Error('Cannot divide by zero');
      value = op === '*' ? value * right : value / right;
    }
    return value;
  }
  function sum() {
    let value = product();
    while (tokens[cursor] === '+' || tokens[cursor] === '-') {
      const op = tokens[cursor++];
      const right = product();
      value = op === '+' ? value + right : value - right;
    }
    return value;
  }
  const result = sum();
  if (cursor !== tokens.length) throw new Error('Unexpected input');
  if (!Number.isFinite(result)) throw new Error('Input is too large');
  return result;
}
