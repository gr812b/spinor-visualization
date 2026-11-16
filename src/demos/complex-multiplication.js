import {
  complex, cMul, cAbs, cArg, complexMatrix, applyMatrix2, interpolateMultiplier,
} from '../math/complex.js';
import { parseScalar } from '../math/parse-scalar.js';
import { DEMOS } from '../math/equations.js';
import { mountEquationLibrary } from '../ui/equation-library.js';

const $ = id => document.getElementById(id);
const svgNS = 'http://www.w3.org/2000/svg';
const svg = $('grid-svg');
const reference = $('reference-grid');
const moving = $('moving-grid');
const vectors = $('grid-vectors');
const fields = ['a','b','u','v'].map($);
const playButton = $('play');
const progressSlider = $('progress');
const W = 760, H = 510, durationMs = 6500;

const view = { pixels: 54, panX: 0, panY: 0 };
const state = { progress: 0, playing: false, frame: null, lastTime: null, dragging: false, lastPointer: null };

const clean = n => Math.abs(n) < 1e-10 ? 0 : n;
function fmt(n) {
  if (!Number.isFinite(n)) return 'undefined';
  n = clean(n);
  if (n === 0) return '0';
  if (Math.abs(n) >= 100000 || Math.abs(n) < 0.0001) return n.toExponential(3);
  return Number(n.toFixed(4)).toString();
}
function fmtComplex(z) {
  return fmt(z.re) + (z.im < 0 ? ' − ' : ' + ') + fmt(Math.abs(z.im)) + 'i';
}
function readValues() {
  try {
    const nums = fields.map(el => parseScalar(el.value));
    const [a,b,u,v] = nums;
    const multiplier = complex(a,b);
    const point = complex(u,v);
    const result = cMul(multiplier,point);
    if (![result.re,result.im,cAbs(multiplier),cAbs(point)].every(Number.isFinite))
      throw new Error('Values are too large');
    $('input-error').textContent = '';
    fields.forEach(el => el.removeAttribute('aria-invalid'));
    return {a,b,u,v,multiplier,point,result};
  } catch (error) {
    $('input-error').textContent = error.message + ' · Try 1/2, -3/4, sqrt(2)/2, or pi/4.';
    return null;
  }
}
function svgNode(parent,name,attrs,label) {
  const node = document.createElementNS(svgNS,name);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,String(value));
  if (label !== undefined) node.textContent = label;
  parent.append(node);
  return node;
}
function xy(point) {
  return [W/2 + view.panX + point[0]*view.pixels, H/2 + view.panY - point[1]*view.pixels];
}
function line(group,from,to,color,width,opacity=1,dash='') {
  const a=xy(from),b=xy(to);
  const attrs={x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:color,'stroke-width':width,'stroke-opacity':opacity};
  if(dash) attrs['stroke-dasharray']=dash;
  return svgNode(group,'line',attrs);
}
function arrow(group,from,to,color,marker,opacity=1,dash='') {
  const a=xy(from),b=xy(to);
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  if(length<6) {
    svgNode(group,'circle',{cx:b[0],cy:b[1],r:2.7,fill:color,'fill-opacity':opacity});
    return;
  }
  const shape=line(group,from,to,color,2.6,opacity,dash);
  // Arrowheads are fixed pixel-size, rather than scaling with the arrow or zoom.
  // Short arrows use a point to avoid a head larger than the shaft.
  if(marker && length>=23) shape.setAttribute('marker-end','url(#'+marker+')');
  else if(marker) svgNode(group,'circle',{cx:b[0],cy:b[1],r:2.8,fill:color});
}
function label(group,point,text,color,dx=8,dy=-10) {
  const [x,y]=xy(point);
  if(x<10 || x>W-40 || y<15 || y>H-12) return;
  svgNode(group,'text',{
    x:x+dx,y:y+dy,fill:color,'font-size':12,'font-weight':650,
    'paint-order':'stroke',stroke:'#f8fbff','stroke-width':3.5,
  },text);
}
function niceStep(pixelsPerUnit) {
  const desired = 67/Math.max(1e-10,pixelsPerUnit);
  const power = Math.pow(10,Math.floor(Math.log10(desired)));
  const options = [1,2,5,10].map(n=>n*power);
  return options.reduce((best,n)=>
    Math.abs(Math.log(n/desired)) < Math.abs(Math.log(best/desired)) ? n : best,options[0]);
}
function drawGrid(matrix,group,color,opacity,width) {
  const mag=Math.hypot(matrix[0][0],matrix[1][0]);
  if(mag<1e-9) return;
  const pixelsPerUnit=view.pixels*mag;
  const step=niceStep(pixelsPerUnit);
  const offset=Math.hypot(W/2+view.panX,H/2+view.panY);
  const reach=Math.max(offset,Math.hypot(W/2-view.panX,H/2-view.panY))+W;
  const extent=Math.min(1e12,reach/Math.max(pixelsPerUnit,1e-10));
  const count=Math.min(80,Math.ceil(extent/step));
  const span=step*(count+3);
  for(let k=-count;k<=count;k++){
    const v=k*step;
    line(group,applyMatrix2(matrix,[v,-span]),applyMatrix2(matrix,[v,span]),color,width,opacity);
    line(group,applyMatrix2(matrix,[-span,v]),applyMatrix2(matrix,[span,v]),color,width,opacity);
  }
}
function formatMatrix(m) {
  return '┌ '+fmt(m[0][0]).padStart(8)+'  '+fmt(m[0][1]).padStart(8)+' ┐\n'
       + '└ '+fmt(m[1][0]).padStart(8)+'  '+fmt(m[1][1]).padStart(8)+' ┘';
}
function stop() {
  state.playing=false;state.lastTime=null;
  if(state.frame!==null) cancelAnimationFrame(state.frame);
  state.frame=null; playButton.textContent='▶ Play';
}
function render() {
  const data=readValues();
  if(!data){stop();return;}
  const {a,b,u,v,multiplier,point,result}=data;
  const current=interpolateMultiplier(multiplier,state.progress);
  const currentMatrix=complexMatrix(current);
  const targetMatrix=complexMatrix(multiplier);
  const output=cMul(current,point);
  const matrixPoint=applyMatrix2(currentMatrix,[u,v]);

  reference.replaceChildren();moving.replaceChildren();vectors.replaceChildren();
  drawGrid([[1,0],[0,1]],reference,'#b4c4d9',.55,1.05);
  drawGrid(currentMatrix,moving,'#0d9488',.72,1.3);
  const currentOne=applyMatrix2(currentMatrix,[1,0]);
  const currentI=applyMatrix2(currentMatrix,[0,1]);
  const one=[currentOne[0],currentOne[1]], imaginary=[currentI[0],currentI[1]];
  arrow(vectors,[0,0],one,'#7c3aed','arrow-violet');
  arrow(vectors,[0,0],imaginary,'#0d9488','arrow-teal');
  arrow(vectors,[0,0],[u,v],'#bd7514',null,.38,'4 5');
  arrow(vectors,[0,0],[output.re,output.im],'#bd7514','arrow-orange');
  label(vectors,one,'T(1) = w(t)','#7c3aed');
  label(vectors,imaginary,'T(i)','#0d9488');
  label(vectors,[output.re,output.im],'T(point)','#a86a0a');
  label(vectors,[0,0],'0','#475569',7,14);

  progressSlider.value=String(state.progress);
  $('progress-label').textContent=Math.round(state.progress*100)+'%';
  $('view-label').textContent=fmt(view.pixels)+' px/unit';
  $('multiplier-summary').textContent=fmtComplex(multiplier);
  $('point-summary').textContent=fmtComplex(point);
  $('current-product').textContent='At '+Math.round(state.progress*100)+'%:  w = '+fmtComplex(current)
    +'\nw × point = '+fmtComplex(output);
  $('expanded-product').textContent=
    '('+fmtComplex(multiplier)+') × ('+fmtComplex(point)+')\n'
    +'= ('+fmt(a)+'×'+fmt(u)+' − '+fmt(b)+'×'+fmt(v)+')\n'
    +'  + ('+fmt(a)+'×'+fmt(v)+' + '+fmt(b)+'×'+fmt(u)+')i\n'
    +'= '+fmtComplex(result);
  $('radius').textContent=fmt(cAbs(multiplier));
  $('angle').textContent=cAbs(multiplier)===0 ? 'undefined' : fmt(cArg(multiplier)*180/Math.PI)+'°';
  $('target-matrix').textContent=formatMatrix(targetMatrix);
  $('current-matrix').textContent=formatMatrix(currentMatrix);
  $('matrix-check').textContent='The violet arrow is the multiplier itself: T(1) = z. The teal arrow is T(i) = iz. These are the two columns of the current matrix.';
  const error=Math.hypot(matrixPoint[0]-output.re,matrixPoint[1]-output.im);
  if(error>1e-7) $('matrix-check').textContent+=' Numerical discrepancy: '+fmt(error);
}
function animate(time) {
  if(!state.playing)return;
  if(state.lastTime!==null) state.progress=Math.min(1,state.progress+(time-state.lastTime)/durationMs);
  state.lastTime=time;
  render();
  if(state.progress>=1){stop();return;}
  state.frame=requestAnimationFrame(animate);
}
playButton.addEventListener('click',()=>{
  if(state.playing){stop();return;}
  if(state.progress>=1)state.progress=0;
  if(!readValues()){render();return;}
  state.playing=true;state.lastTime=null;playButton.textContent='❚❚ Pause';
  state.frame=requestAnimationFrame(animate);
});
$('reset').addEventListener('click',()=>{stop();state.progress=0;render();});
progressSlider.addEventListener('input',()=>{stop();state.progress=Number(progressSlider.value);render();});
for(const field of fields) field.addEventListener('input',()=>{stop();render();});
for(const button of document.querySelectorAll('[data-example]')){
  button.addEventListener('click',()=>{
    const [a,b]=button.dataset.example.split(',');
    $('a').value=a;$('b').value=b;stop();state.progress=0;render();
  });
}
function zoomAt(factor,x=W/2,y=H/2) {
  const previous=view.pixels;
  view.pixels=Math.max(4,Math.min(400,previous*factor));
  const ratio=view.pixels/previous;
  view.panX=x-W/2-(x-W/2-view.panX)*ratio;
  view.panY=y-H/2-(y-H/2-view.panY)*ratio;
  render();
}
$('zoom-in').addEventListener('click',()=>zoomAt(1.3));
$('zoom-out').addEventListener('click',()=>zoomAt(1/1.3));
$('reset-view').addEventListener('click',()=>{
  view.pixels=54;view.panX=0;view.panY=0;render();
});
$('fit-view').addEventListener('click',()=>{
  const data=readValues();if(!data)return;
  const m=complexMatrix(data.multiplier);
  const points=[
    [0,0],[1,0],[0,1],[data.u,data.v],
    applyMatrix2(m,[data.u,data.v]),
    applyMatrix2(m,[1,0]),applyMatrix2(m,[0,1]),
  ];
  const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
  const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  view.pixels=Math.max(4,Math.min(250,Math.min((W-120)/Math.max(2,maxX-minX),(H-105)/Math.max(2,maxY-minY))));
  view.panX=-(minX+maxX)*view.pixels/2;
  view.panY=(minY+maxY)*view.pixels/2;
  render();
});
function toSvgPosition(event){
  const r=svg.getBoundingClientRect();
  return [(event.clientX-r.left)*W/r.width,(event.clientY-r.top)*H/r.height];
}
svg.addEventListener('wheel',event=>{
  event.preventDefault();
  const [x,y]=toSvgPosition(event);
  zoomAt(Math.exp(-event.deltaY*.0015),x,y);
},{passive:false});
svg.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  state.dragging=true;
  state.lastPointer=toSvgPosition(event);
  svg.setPointerCapture(event.pointerId);
  svg.style.cursor='grabbing';
});
svg.addEventListener('pointermove',event=>{
  if(!state.dragging)return;
  const [x,y]=toSvgPosition(event);
  view.panX+=x-state.lastPointer[0];
  view.panY+=y-state.lastPointer[1];
  state.lastPointer=[x,y];
  render();
});
function releaseDrag(event){
  if(!state.dragging)return;
  state.dragging=false;state.lastPointer=null;
  if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
  svg.style.cursor='grab';
}
svg.addEventListener('pointerup',releaseDrag);
svg.addEventListener('pointercancel',releaseDrag);
svg.addEventListener('keydown',event=>{
  if(event.key==='+' || event.key==='='){event.preventDefault();zoomAt(1.3);}
  if(event.key==='-'){event.preventDefault();zoomAt(1/1.3);}
  if(event.key==='0'){$('reset-view').click();}
});

const demo=DEMOS.find(d=>d.id==='complex-multiplication');
mountEquationLibrary($('equation-inspector'),demo.equationIds);
render();
