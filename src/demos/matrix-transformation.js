import { complexMatrix, applyMatrix2, cAbs, cArg } from '../math/complex.js';
import { parseScalar } from '../math/parse-scalar.js';
import {
  interpolateMatrix2, determinant2, complexFromMatrix2,
  isSymmetricMatrix2, realEigenstructure2, imageOfUnitCircle,
  svgLinearMatrix2, unitCirclePoint,
} from '../math/matrix2.js';
import {
  worldToScreen, screenToWorld, zoomViewport, fitViewport, niceGridStep,
} from '../math/viewport.js';
import { renderMatrix2, renderVector2, formatReal as fmt } from '../ui/matrix-display.js';
import { DEMOS } from '../math/equations.js';
import { mountEquationLibrary } from '../ui/equation-library.js';

const $ = id => document.getElementById(id);
const NS = 'http://www.w3.org/2000/svg';
const W=760, H=510, durationMs=6500;
const svg=$('matrix-plot');
const view={pixels:88,panX:0,panY:0};
const state={
  mode:'matrix', progress:0, playing:false, lastTime:null, frame:null,
  pointerMode:null, lastPointer:null,
};
const generalIds=['m11','m12','m21','m22'];
const complexIds=['zr','zi'];

function svgNode(parent,tag,attrs,text) {
  const node=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
  if(text!==undefined)node.textContent=text;
  parent.append(node);
  return node;
}
function xy(point) { return worldToScreen(view,point,W,H); }
function screenLine(group,from,to,color,width=1.5,dash='',opacity=1) {
  const [x1,y1]=xy(from),[x2,y2]=xy(to);
  const attrs={x1,y1,x2,y2,stroke:color,'stroke-width':width,'stroke-opacity':opacity};
  if(dash)attrs['stroke-dasharray']=dash;
  return svgNode(group,'line',attrs);
}
function screenArrow(group,from,to,color,marker,opacity=1,dash='') {
  const a=xy(from),b=xy(to);
  const len=Math.hypot(a[0]-b[0],a[1]-b[1]);
  if(len<5){
    svgNode(group,'circle',{cx:b[0],cy:b[1],r:3,fill:color});
    return;
  }
  const line=screenLine(group,from,to,color,2.5,dash,opacity);
  if(marker && len>22)line.setAttribute('marker-end','url(#'+marker+')');
}
function textAt(group,point,label,color,dx=7,dy=-8) {
  const [x,y]=xy(point);
  if(x<13||x>W-65||y<12||y>H-12)return;
  svgNode(group,'text',{
    x:x+dx,y:y+dy,fill:color,'font-size':12,'font-weight':640,
    'paint-order':'stroke',stroke:'#0c1626','stroke-width':3,
  },label);
}
function readTarget(){
  const ids=state.mode==='matrix'?generalIds:complexIds;
  try{
    const values=ids.map(id=>parseScalar($(id).value));
    const matrix=state.mode==='matrix'?
      [[values[0],values[1]],[values[2],values[3]]]:
      complexMatrix({re:values[0],im:values[1]});
    if(matrix.flat().some(v=>!Number.isFinite(v)) ||
       !Number.isFinite(determinant2(matrix)))
      throw Error('Matrix values are too large');
    $('input-error').textContent='';
    return matrix;
  }catch(error){
    $('input-error').textContent=error.message+' · Inputs accept fractions, √(2), and pi.';
    return null;
  }
}
function drawReferenceGrid() {
  const group=$('plot-grid');
  group.replaceChildren();
  const p1=screenToWorld(view,[0,H],W,H);
  const p2=screenToWorld(view,[W,0],W,H);
  const step=niceGridStep(view.pixels);
  const [minX,minY]=p1,[maxX,maxY]=p2;
  const firstX=Math.ceil(minX/step),lastX=Math.floor(maxX/step);
  const firstY=Math.ceil(minY/step),lastY=Math.floor(maxY/step);
  for(let k=firstX;k<=Math.min(lastX,firstX+90);k++){
    screenLine(group,[k*step,minY],[k*step,maxY],
      k===0?'#8a9db7':'#34465f',k===0?1.45:.8,'',k===0?.8:.55);
    if(k!==0){
      const [sx,sy]=xy([k*step,0]);
      if(sy>10&&sy<H-13&&sx>15&&sx<W-20)
        svgNode(group,'text',{x:sx+3,y:sy+13,fill:'#94a9c5','font-size':10},fmt(k*step));
    }
  }
  for(let k=firstY;k<=Math.min(lastY,firstY+90);k++){
    screenLine(group,[minX,k*step],[maxX,k*step],
      k===0?'#8a9db7':'#34465f',k===0?1.45:.8,'',k===0?.8:.55);
    if(k!==0){
      const [sx,sy]=xy([0,k*step]);
      if(sx>10&&sx<W-35&&sy>13&&sy<H-12)
        svgNode(group,'text',{x:sx+5,y:sy-4,fill:'#94a9c5','font-size':10},fmt(k*step));
    }
  }
}
function renderEigenlines(target) {
  const group=$('plot-eigens');
  group.replaceChildren();
  if(!$('show-eigens').checked)return;
  const eig=realEigenstructure2(target);
  const extent=Math.max(8,(W+H+Math.abs(view.panX)+Math.abs(view.panY))/view.pixels);
  for(const [i,item] of eig.directions.entries()){
    const v=item.vector;if(!v)continue;
    const color=i===0?'#ff83c8':'#a6bfff';
    screenLine(group,[-v[0]*extent,-v[1]*extent],
      [v[0]*extent,v[1]*extent],color,1.7,'7 6',.75);
    textAt(group,[v[0]*1.65,v[1]*1.65],'λ = '+fmt(item.value),color);
  }
}
function renderShape(current) {
  const world=$('unit-world');
  const center=xy([0,0]);
  world.setAttribute('transform',
    'translate('+center[0]+' '+center[1]+') scale('+view.pixels+' '+(-view.pixels)+')');
  const geometry=imageOfUnitCircle(current);
  const transformed=$('moving-shape');
  transformed.setAttribute('transform',svgLinearMatrix2(current));
  const degenerate=$('plot-degenerate');
  degenerate.replaceChildren();
  const isDegenerate=geometry.kind==='point'||geometry.kind==='segment';
  transformed.style.display=isDegenerate?'none':'';
  if(geometry.kind==='point'){
    const [x,y]=center;
    svgNode(degenerate,'circle',{cx:x,cy:y,r:4,fill:'#55ddcb'});
  }else if(geometry.kind==='segment'){
    const [x,y]=geometry.endpoint;
    screenLine(degenerate,[-x,-y],[x,y],'#55ddcb',3.3);
    [1,-1].forEach(s=>{
      const p=xy([s*x,s*y]);
      svgNode(degenerate,'circle',{cx:p[0],cy:p[1],r:3,fill:'#55ddcb'});
    });
  }
}
function renderVectors(current){
  const group=$('plot-vectors');
  group.replaceChildren();
  const angle=Number($('vector-angle').value)*Math.PI/180;
  const input=unitCirclePoint(angle);
  const output=applyMatrix2(current,input);
  const e1=applyMatrix2(current,[1,0]);
  const e2=applyMatrix2(current,[0,1]);
  screenArrow(group,[0,0],e1,'#b6a0ff','tip-violet');
  screenArrow(group,[0,0],e2,'#55ddcb','tip-teal');
  screenArrow(group,[0,0],input,'#ffbf6e',null,.45,'4 5');
  screenArrow(group,[0,0],output,'#ffbf6e','tip-gold');
  const [hx,hy]=xy(input);
  svgNode(group,'circle',{cx:hx,cy:hy,r:9,fill:'#ffbf6e','fill-opacity':.25,
    stroke:'#ffbf6e','stroke-width':1.5,'data-vector-handle':'true'});
  svgNode(group,'circle',{cx:hx,cy:hy,r:3.7,fill:'#ffbf6e','pointer-events':'none'});
  textAt(group,e1,'M(t)e₁','#b6a0ff');
  textAt(group,e2,'M(t)e₂','#55ddcb');
  textAt(group,output,'M(t)v','#ffbf6e',8,15);
  $('angle-label').textContent=Math.round(Number($('vector-angle').value))+'°';
  renderVector2($('vector-input'),input);
  renderVector2($('vector-output'),output);
}
function describeEigenstructure(target) {
  const eigen=realEigenstructure2(target);
  if(eigen.kind==='none')return 'No real eigendirections: every nonzero real vector turns away from its original line.';
  if(eigen.kind==='all')return 'Every direction is an eigenvector (λ = '+fmt(eigen.values[0])+').';
  const items=eigen.directions.map((e,i)=>
    'λ'+(i+1)+' = '+fmt(e.value)+' along ('+fmt(e.vector[0])+', '+fmt(e.vector[1])+')');
  return items.join(' · ')+(eigen.kind==='one'?' · One eigendirection':'');
}
function renderFacts(target) {
  const geometry=imageOfUnitCircle(target);
  const z=complexFromMatrix2(target);
  const det=determinant2(target);
  $('recognized-complex').textContent=z?
    'z = '+fmt(z.re)+(z.im<0?' − ':' + ')+fmt(Math.abs(z.im))+'i':
    'general real 2×2';
  $('det-value').textContent=fmt(det)+(det<0?' · flipped':det===0?' · collapsed':'');
  $('shape-kind').textContent=geometry.kind;
  $('singular-values').textContent=geometry.singularValues.map(fmt).join(' / ');
  $('eigen-summary').textContent=describeEigenstructure(target);
  let insight='';
  if(z) {
    const angle=cAbs(z)===0?'undefined':fmt(cArg(z)*180/Math.PI)+'°';
    insight='Complex multiplication: uniform scale '+fmt(cAbs(z))+', rotation '+angle+'.';
  }else if(geometry.kind==='circle') {
    insight='Still a circle, but not complex multiplication: reflections can also preserve circles.';
  }else if(geometry.kind==='segment'||geometry.kind==='point') {
    insight='The matrix is singular: the circle collapses to a '+geometry.kind+'.';
  }else if(isSymmetricMatrix2(target)) {
    insight='Symmetric matrix: the ellipse axes align with perpendicular eigendirections.';
  }else {
    insight='For general matrices, ellipse axes need not align with eigenvectors.';
  }
  $('geometry-summary').textContent=insight+
    ' Animation: M(t) = (1−t)I + tM.';
}
let lastGridKey='',lastEigenKey='',lastFactsKey='';
function render(){
  const target=readTarget();
  if(!target){stop();return;}
  const current=interpolateMatrix2(target,state.progress);
  const viewKey=[view.pixels,view.panX,view.panY].join('|');
  const targetKey=target.flat().join('|');
  if(viewKey!==lastGridKey){
    drawReferenceGrid();
    lastGridKey=viewKey;
  }
  const eigenKey=viewKey+'|'+targetKey+'|'+$('show-eigens').checked;
  if(eigenKey!==lastEigenKey){
    renderEigenlines(target);
    lastEigenKey=eigenKey;
  }
  renderShape(current);
  renderVectors(current);
  renderMatrix2($('current-matrix'),current);
  if(targetKey!==lastFactsKey){
    renderMatrix2($('target-matrix'),target);
    renderFacts(target);
    lastFactsKey=targetKey;
  }
  $('progress').value=String(state.progress);
  $('progress-label').textContent=Math.round(state.progress*100)+'%';
  $('view-label').textContent=fmt(view.pixels)+' px/unit';
}
function stop(){
  state.playing=false;state.lastTime=null;
  if(state.frame!==null)cancelAnimationFrame(state.frame);
  state.frame=null;$('play').textContent='▶ Play';
}
function frame(now){
  if(!state.playing)return;
  if(state.lastTime!==null)
    state.progress=Math.min(1,state.progress+(now-state.lastTime)/durationMs);
  state.lastTime=now;
  render();
  if(state.progress>=1){stop();return;}
  state.frame=requestAnimationFrame(frame);
}
$('play').addEventListener('click',()=>{
  if(state.playing){stop();return;}
  if(!readTarget())return;
  if(state.progress>=1)state.progress=0;
  state.playing=true;state.lastTime=null;
  $('play').textContent='❚❚ Pause';
  state.frame=requestAnimationFrame(frame);
});
$('reset').addEventListener('click',()=>{stop();state.progress=0;render();});
$('progress').addEventListener('input',event=>{stop();state.progress=Number(event.target.value);render();});
$('vector-angle').addEventListener('input',render);
$('show-eigens').addEventListener('change',render);
for(const id of [...generalIds,...complexIds])$(id).addEventListener('input',()=>{stop();render();});

function setMode(mode){
  stop();
  state.mode=mode;
  $('matrix-inputs').hidden=mode!=='matrix';
  $('complex-inputs').hidden=mode!=='complex';
  for(const key of ['matrix','complex']){
    $('tab-'+key).classList.toggle('active',key===mode);
    $('tab-'+key).setAttribute('aria-selected',String(key===mode));
  }
  state.progress=0;
  render();
}
$('tab-matrix').addEventListener('click',()=>setMode('matrix'));
$('tab-complex').addEventListener('click',()=>setMode('complex'));
document.querySelectorAll('[data-matrix]').forEach(button=>{
  button.addEventListener('click',()=>{
    const parts=button.dataset.matrix.split(',');
    generalIds.forEach((id,i)=>$(id).value=parts[i]);
    stop();state.progress=0;render();
  });
});
document.querySelectorAll('[data-complex]').forEach(button=>{
  button.addEventListener('click',()=>{
    const parts=button.dataset.complex.split(',');
    complexIds.forEach((id,i)=>$(id).value=parts[i]);
    stop();state.progress=0;render();
  });
});
function zoomAt(factor,x=W/2,y=H/2){
  Object.assign(view,zoomViewport(view,factor,x,y,W,H));
  render();
}
$('zoom-in').addEventListener('click',()=>zoomAt(1.3));
$('zoom-out').addEventListener('click',()=>zoomAt(1/1.3));
$('reset-view').addEventListener('click',()=>{
  Object.assign(view,{pixels:88,panX:0,panY:0});render();
});
$('fit-view').addEventListener('click',()=>{
  const target=readTarget();
  if(!target)return;
  const x=Math.max(1,Math.hypot(...target[0]));
  const y=Math.max(1,Math.hypot(...target[1]));
  Object.assign(view,fitViewport([[-x,-y],[x,y]],W,H));
  render();
});
function pointerPosition(event){
  const rect=svg.getBoundingClientRect();
  return [(event.clientX-rect.left)*W/rect.width,
    (event.clientY-rect.top)*H/rect.height];
}
function angleFromPoint(point){
  const [x,y]=screenToWorld(view,point,W,H);
  const degrees=(Math.atan2(y,x)*180/Math.PI+360)%360;
  $('vector-angle').value=String(Math.round(degrees));
  render();
}
svg.addEventListener('pointerdown',event=>{
  if(event.button!==0)return;
  const position=pointerPosition(event);
  const r=screenToWorld(view,position,W,H);
  const angle=Number($('vector-angle').value)*Math.PI/180;
  const handle=xy(unitCirclePoint(angle));
  const onHandle=Math.hypot(position[0]-handle[0],position[1]-handle[1])<23;
  const onCircle=Math.abs(Math.hypot(...r)-1)*view.pixels<12;
  state.pointerMode=onHandle||onCircle?'vector':'pan';
  state.lastPointer=position;
  svg.setPointerCapture(event.pointerId);
  svg.style.cursor=state.pointerMode==='vector'?'crosshair':'grabbing';
  if(state.pointerMode==='vector')angleFromPoint(position);
});
svg.addEventListener('pointermove',event=>{
  if(!state.pointerMode)return;
  const position=pointerPosition(event);
  if(state.pointerMode==='vector')angleFromPoint(position);
  else{
    view.panX+=position[0]-state.lastPointer[0];
    view.panY+=position[1]-state.lastPointer[1];
    render();
  }
  state.lastPointer=position;
});
function releasePointer(event){
  if(!state.pointerMode)return;
  state.pointerMode=null;state.lastPointer=null;
  if(svg.hasPointerCapture(event.pointerId))svg.releasePointerCapture(event.pointerId);
  svg.style.cursor='grab';
}
svg.addEventListener('pointerup',releasePointer);
svg.addEventListener('pointercancel',releasePointer);
svg.addEventListener('wheel',event=>{
  event.preventDefault();
  const [x,y]=pointerPosition(event);
  zoomAt(Math.exp(-event.deltaY*.0015),x,y);
},{passive:false});
svg.addEventListener('keydown',event=>{
  if(event.key==='+'||event.key==='='){event.preventDefault();zoomAt(1.3);}
  if(event.key==='-'){event.preventDefault();zoomAt(1/1.3);}
  if(event.key==='0'){$('reset-view').click();}
});
const demo=DEMOS.find(d=>d.id==='matrix-transformation');
mountEquationLibrary($('equation-inspector'),demo.equationIds);
render();
