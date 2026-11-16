import {
  complex, cMul, cAbs, cArg, complexMatrix, applyMatrix2,
  interpolateMultiplier,
} from '../math/complex.js';
import { DEMOS } from '../math/equations.js';
import { mountEquationLibrary } from '../ui/equation-library.js';

const $ = id => document.getElementById(id);
const inputs = ['a', 'b', 'u', 'v'].map($);
const svgNS = 'http://www.w3.org/2000/svg';
const svg = $('grid-svg');
const reference = $('reference-grid');
const moving = $('moving-grid');
const vectors = $('grid-vectors');
const progressSlider = $('progress');
const playButton = $('play');
const origin = [380, 260];
const state = { progress: 0, playing: false, frame: null, lastTime: null };
const durationMs = 6500;

const clean = n => Math.abs(n) < 1e-10 ? 0 : n;
function fmt(n) {
  if (!Number.isFinite(n)) return 'undefined';
  n = clean(n);
  if (n === 0) return '0';
  if (Math.abs(n) >= 100000 || Math.abs(n) < 0.0001) return n.toExponential(3);
  return Number(n.toFixed(4)).toString();
}
function fmtComplex(z) {
  const real = fmt(z.re);
  const imaginary = fmt(Math.abs(z.im));
  return real + (z.im < 0 ? ' − ' : ' + ') + imaginary + 'i';
}
function readValues() {
  if (inputs.some(el => el.value.trim() === '')) return null;
  const nums = inputs.map(el => Number(el.value));
  if (nums.some(n => !Number.isFinite(n))) return null;
  const [a,b,u,v] = nums;
  const multiplier = complex(a,b);
  const point = complex(u,v);
  const result = cMul(multiplier,point);
  if (![result.re,result.im,cAbs(multiplier),cAbs(point)].every(Number.isFinite)) return null;
  return { a,b,u,v,multiplier,point,result };
}
function svgNode(parent, name, attrs, label) {
  const node = document.createElementNS(svgNS, name);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,String(value));
  if (label !== undefined) node.textContent = label;
  parent.append(node);
  return node;
}
function screen(p, scale) {
  return [origin[0] + p[0]*scale,origin[1] - p[1]*scale];
}
function drawLine(group, from, to, scale, stroke, width, opacity=1, dash='') {
  const a=screen(from,scale), b=screen(to,scale);
  const attrs={ x1:a[0],y1:a[1],x2:b[0],y2:b[1], stroke,
    'stroke-width':width,'stroke-opacity':opacity };
  if (dash) attrs['stroke-dasharray']=dash;
  return svgNode(group,'line',attrs);
}
function drawArrow(group, from, to, scale, stroke, marker, opacity=1, dash='') {
  const l=drawLine(group,from,to,scale,stroke,3,opacity,dash);
  if (marker) l.setAttribute('marker-end','url(#'+marker+')');
}
function drawText(group, x,y,label,color) {
  svgNode(group,'text',{x,y,fill:color,'font-size':14,'font-weight':650,
    'paint-order':'stroke','stroke':'#f8fbff','stroke-width':4},label);
}
function drawGrid(matrix, targetGroup, scale, color, opacity, width) {
  // Draw the full family of equally spaced horizontal and vertical lines.
  // Apply the SAME matrix as in the numerical calculation.
  for(let k=-14;k<=14;k++) {
    const verticalA=applyMatrix2(matrix,[k,-14]);
    const verticalB=applyMatrix2(matrix,[k,14]);
    const horizontalA=applyMatrix2(matrix,[-14,k]);
    const horizontalB=applyMatrix2(matrix,[14,k]);
    drawLine(targetGroup,verticalA,verticalB,scale,color,width,opacity);
    drawLine(targetGroup,horizontalA,horizontalB,scale,color,width,opacity);
  }
}
function formatMatrix(matrix) {
  return '┌ ' + fmt(matrix[0][0]).padStart(9) + '  ' + fmt(matrix[0][1]).padStart(9) + ' ┐\n'
       + '└ ' + fmt(matrix[1][0]).padStart(9) + '  ' + fmt(matrix[1][1]).padStart(9) + ' ┘';
}
function stop() {
  state.playing=false;
  state.lastTime=null;
  if(state.frame!==null) cancelAnimationFrame(state.frame);
  state.frame=null;
  playButton.textContent='▶ Play';
}
function render() {
  const data=readValues();
  $('input-error').textContent = data ? '' : 'Please enter finite numbers in all four fields (results must also be finite).';
  if (!data) { stop(); return; }
  const {a,b,u,v,multiplier,point,result}=data;
  const current=interpolateMultiplier(multiplier,state.progress);
  const currentProduct=cMul(current,point);
  const currentMatrix=complexMatrix(current);
  const targetMatrix=complexMatrix(multiplier);
  const matrixPoint=applyMatrix2(currentMatrix,[u,v]);

  // Scale viewport consistently for the original input, transformed input, and grid.
  const span=Math.max(1,cAbs(multiplier),cAbs(point),cAbs(result),cAbs(currentProduct));
  const scale=51/span;
  reference.replaceChildren(); moving.replaceChildren(); vectors.replaceChildren();
  drawGrid([[1,0],[0,1]],reference,scale,'#b9c7d8',.65,1.1);
  drawGrid(currentMatrix,moving,scale,'#0d9488',.70,1.4);
  drawArrow(vectors,[0,0],[1,0],scale,'#a0afbf',null,.9);
  drawArrow(vectors,[0,0],[0,1],scale,'#a0afbf',null,.9);
  drawArrow(vectors,[0,0],applyMatrix2(currentMatrix,[1,0]),scale,'#2563eb','arrow-blue');
  drawArrow(vectors,[0,0],applyMatrix2(currentMatrix,[0,1]),scale,'#0d9488','arrow-teal');
  drawArrow(vectors,[0,0],[u,v],scale,'#c27817',null,.42,'5 5');
  drawArrow(vectors,[0,0],[currentProduct.re,currentProduct.im],scale,'#c27817','arrow-orange');
  const end=screen([currentProduct.re,currentProduct.im],scale);
  const tx=Math.max(12,Math.min(700,end[0]+12));
  const ty=Math.max(22,Math.min(497,end[1]-12));
  drawText(vectors,tx,ty,'w(t) × point','#9a5b0a');
  drawText(vectors,origin[0]+9,origin[1]+17,'0','#475569');

  $('progress-label').textContent=Math.round(state.progress*100)+'%';
  progressSlider.value=String(state.progress);
  $('current-product').textContent=
    'w(t) = '+fmtComplex(current)+'\n'
    +'point = '+fmtComplex(point)+'\n'
    +'w(t) × point = '+fmtComplex(currentProduct);
  $('expanded-product').textContent=
    '('+fmt(a)+' + '+fmt(b)+'i)('+fmt(u)+' + '+fmt(v)+'i)\n'
    +'= ('+fmt(a)+' × '+fmt(u)+' − '+fmt(b)+' × '+fmt(v)+')\n'
    +'  + ('+fmt(a)+' × '+fmt(v)+' + '+fmt(b)+' × '+fmt(u)+')i\n'
    +'= '+fmtComplex(result);
  $('radius').textContent=fmt(cAbs(multiplier));
  $('angle').textContent=cAbs(multiplier)===0 ? 'undefined' : fmt(cArg(multiplier)*180/Math.PI)+'°';
  $('target-matrix').textContent=formatMatrix(targetMatrix);
  $('current-matrix').textContent=formatMatrix(currentMatrix);
  const discrepancy=Math.hypot(matrixPoint[0]-currentProduct.re,matrixPoint[1]-currentProduct.im);
  $('matrix-check').textContent='Matrix × ('+fmt(u)+', '+fmt(v)+') = ('
    +fmt(matrixPoint[0])+', '+fmt(matrixPoint[1])+'). Same point as complex multiplication.'
    +(discrepancy > 1e-7 ? ' Numerical mismatch: '+fmt(discrepancy) : '');
}
function animate(now) {
  if(!state.playing) return;
  if(state.lastTime!==null) state.progress=Math.min(1,state.progress+(now-state.lastTime)/durationMs);
  state.lastTime=now;
  render();
  if(state.progress>=1){ stop(); return; }
  state.frame=requestAnimationFrame(animate);
}
playButton.addEventListener('click',()=>{
  if(state.playing){stop();return;}
  if(state.progress>=1) state.progress=0;
  if(!readValues()){render();return;}
  state.playing=true; state.lastTime=null; playButton.textContent='❚❚ Pause';
  state.frame=requestAnimationFrame(animate);
});
$('reset').addEventListener('click',()=>{stop();state.progress=0;render();});
progressSlider.addEventListener('input',()=>{
  stop();state.progress=Number(progressSlider.value);render();
});
for(const el of inputs) el.addEventListener('input',render);
for(const button of document.querySelectorAll('[data-example]')) {
  button.addEventListener('click',()=>{
    const [a,b]=button.dataset.example.split(',');
    $('a').value=a;$('b').value=b;stop();state.progress=0;render();
  });
}
const demo=DEMOS.find(d=>d.id==='complex-multiplication');
mountEquationLibrary($('equation-inspector'),demo.equationIds);
render();
