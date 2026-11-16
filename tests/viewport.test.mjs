import test from 'node:test';
import assert from 'node:assert/strict';
import { worldToScreen, screenToWorld, zoomViewport, fitViewport, niceGridStep } from '../src/math/viewport.js';

function near(a,b,tol=1e-9) { assert.ok(Math.abs(a-b)<tol,a+' ≉ '+b); }

test('screen/world coordinates roundtrip with arbitrary pan and zoom',()=>{
  const view={pixels:83,panX:-44,panY:77};
  for(const point of [[0,0],[1,2],[-4,3],[.5,-.8]]) {
    const screen=worldToScreen(view,point,760,510);
    const recovered=screenToWorld(view,screen,760,510);
    near(recovered[0],point[0]);near(recovered[1],point[1]);
  }
});
test('zoom around mouse cursor preserves the world point underneath it',()=>{
  const view={pixels:54,panX:-23,panY:42};
  const anchor=[643,147];
  const before=screenToWorld(view,anchor,760,510);
  const after=zoomViewport(view,2.5,...anchor,760,510);
  const unchanged=screenToWorld(after,anchor,760,510);
  near(unchanged[0],before[0]);near(unchanged[1],before[1]);
  near(after.pixels,135);
});
test('fit centers a set of visible input and result vectors',()=>{
  const points=[[0,0],[1,0],[0,1],[-3,-4],[7,2],[2,8]];
  const view=fitViewport(points,760,510);
  for(const p of points) {
    const [x,y]=worldToScreen(view,p,760,510);
    assert.ok(x>=59&&x<=701, 'x outside padded viewport: '+x);
    assert.ok(y>=51&&y<=459, 'y outside padded viewport: '+y);
  }
});
test('adaptive grid steps stay legible across different zoom levels',()=>{
  for(const px of [.001,.1,1,12,54,200,10000]) {
    const step=niceGridStep(px);
    assert.ok(step>0&&Number.isFinite(step));
    assert.ok(px*step>30&&px*step<140,'grid step too dense/sparse '+px*step);
  }
});
