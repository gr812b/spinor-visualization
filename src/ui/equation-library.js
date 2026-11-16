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
  el('line', {x1:12,y1:70,x2:264,y2:70,stroke:'#647a97','stroke-width':1});
  el('line', {x1:90,y1:82,x2:90,y2:6,stroke:'#647a97','stroke-width':1});
  const arrow = (x,y,color) => {
    el('line',{x1:90,y1:70,x2:x,y2:y,stroke:color,'stroke-width':3,'stroke-linecap':'round'});
    el('circle',{cx:x,cy:y,r:4,fill:color});
  };
  if(kind === 'ellipse'){
    el('circle',{cx:93,cy:48,r:30,fill:'none',stroke:'#758ca9','stroke-width':1.5,'stroke-dasharray':'4 4'});
    el('ellipse',{cx:177,cy:48,rx:62,ry:24,fill:'#55ddcb','fill-opacity':.10,stroke:'#55ddcb','stroke-width':2});
    el('line',{x1:115,y1:48,x2:239,y2:48,stroke:'#b6a0ff','stroke-dasharray':'4 4'});
    el('text',{x:118,y:16,fill:'#a7b8ce','font-size':11}).textContent='M';
  }else if(kind === 'eigen'){
    el('circle',{cx:134,cy:49,r:34,fill:'none',stroke:'#6a7c95','stroke-dasharray':'4 4'});
    el('line',{x1:47,y1:84,x2:221,y2:14,stroke:'#ff83c8','stroke-width':2});
    el('line',{x1:81,y1:5,x2:193,y2:91,stroke:'#a6bfff','stroke-width':2});
    el('text',{x:228,y:20,fill:'#ff83c8','font-size':12}).textContent='λ₁';
    el('text',{x:200,y:86,fill:'#a6bfff','font-size':12}).textContent='λ₂';
  }else if (kind === 'spinor') {
    el('circle',{cx:105,cy:47,r:34,stroke:'#7894b7','stroke-width':1,fill:'#172b45'});
    el('ellipse',{cx:105,cy:47,rx:34,ry:12,stroke:'#7f9cbe','stroke-width':1,fill:'none'});
    el('line',{x1:105,y1:47,x2:124,y2:15,stroke:'#ff82c9','stroke-width':3});
    el('circle',{cx:124,cy:15,r:4,fill:'#ff82c9'});
    el('text',{x:154,y:32,fill:'#b7c9e0','font-size':13}).textContent='Bloch vector';
  } else if (kind === 'conjugate') {
    arrow(151,28,'#8bb4ff'); arrow(151,82,'#c084fc');
  } else if (kind === 'matrix') {
    arrow(144,49,'#8bb4ff'); arrow(69,16,'#55ddcb');
    el('line',{x1:144,y1:49,x2:123,y2:-5,stroke:'#c084fc','stroke-width':1,'stroke-dasharray':'4 4'});
  } else if (kind === 'polar') {
    el('circle',{cx:90,cy:70,r:52,fill:'none',stroke:'#94a3b8','stroke-dasharray':'3 5'});
    arrow(131,38,'#55ddcb');
  } else {
    arrow(139,59,'#8bb4ff'); arrow(175,27,'#55ddcb');
  }
  return svg;
}
