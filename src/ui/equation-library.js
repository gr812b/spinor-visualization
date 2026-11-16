import { EQUATIONS } from '../math/equations.js';

// One inspector component for demos and the full reference page.
export function mountEquationLibrary(container, ids = Object.keys(EQUATIONS), expanded = false) {
  container.replaceChildren();
  for (const id of ids) {
    const e = EQUATIONS[id];
    if (!e) throw new Error('Unknown equation: ' + id);

    const details = document.createElement('details');
    details.className = 'equation-card';
    if (expanded) details.open = true;

    const heading = document.createElement('summary');
    heading.textContent = e.title;
    details.append(heading);

    const equation = document.createElement('div');
    equation.className = 'equation-expression';
    equation.textContent = e.expression;
    details.append(equation);

    const figure = document.createElement('div');
    figure.className = 'equation-visual';
    figure.append(makeVisual(e.visual));
    details.append(figure);

    const why = document.createElement('p');
    why.textContent = e.why;
    const picture = document.createElement('p');
    picture.className = 'eq-picture';
    picture.textContent = 'Picture it: ' + e.picture;
    const symbols = document.createElement('p');
    symbols.className = 'eq-symbols';
    symbols.textContent = e.symbols;
    const implementation = document.createElement('code');
    implementation.className = 'eq-implementation';
    implementation.textContent = 'Implementation: ' + e.functions.map(fn => fn.name + '()').join(', ') + ' · ' + e.source;
    details.append(why, picture, symbols, implementation);
    container.append(details);
  }
}

// Small visual reminder for each family of equations, not a second math engine.
function makeVisual(kind) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 280 90');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Geometric reminder: ' + kind);
  const el = (tag, attrs) => {
    const node = document.createElementNS(svg.namespaceURI, tag);
    for (const [key, val] of Object.entries(attrs)) node.setAttribute(key, String(val));
    svg.append(node);
    return node;
  };
  el('line', {x1:12,y1:70,x2:264,y2:70,stroke:'#99a8ba','stroke-width':1});
  el('line', {x1:90,y1:82,x2:90,y2:6,stroke:'#99a8ba','stroke-width':1});
  const arrow = (x,y,color) => {
    el('line',{x1:90,y1:70,x2:x,y2:y,stroke:color,'stroke-width':3,'stroke-linecap':'round'});
    el('circle',{cx:x,cy:y,r:4,fill:color});
  };
  if (kind === 'spinor') {
    el('circle',{cx:105,cy:47,r:34,stroke:'#b7c8df','stroke-width':1,fill:'#edf3fa'});
    el('ellipse',{cx:105,cy:47,rx:34,ry:12,stroke:'#9fb4d1','stroke-width':1,fill:'none'});
    el('line',{x1:105,y1:47,x2:124,y2:15,stroke:'#c0268b','stroke-width':3});
    el('circle',{cx:124,cy:15,r:4,fill:'#c0268b'});
    el('text',{x:154,y:32,fill:'#52647b','font-size':13}).textContent='Bloch vector';
  } else if (kind === 'conjugate') {
    arrow(151,28,'#2563eb'); arrow(151,82,'#c084fc');
  } else if (kind === 'matrix') {
    arrow(144,49,'#2563eb'); arrow(69,16,'#0d9488');
    el('line',{x1:144,y1:49,x2:123,y2:-5,stroke:'#c084fc','stroke-width':1,'stroke-dasharray':'4 4'});
  } else if (kind === 'polar') {
    el('circle',{cx:90,cy:70,r:52,fill:'none',stroke:'#94a3b8','stroke-dasharray':'3 5'});
    arrow(131,38,'#0d9488');
  } else {
    arrow(139,59,'#2563eb'); arrow(175,27,'#0d9488');
  }
  return svg;
}
