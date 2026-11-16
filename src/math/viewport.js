// Shared viewport math for current and future 2D interactive demonstrations.
// In this UI, x points right and y points upward; screen pixels point downward.
export function worldToScreen(view, point, width, height) {
  return [
    width/2 + view.panX + point[0]*view.pixels,
    height/2 + view.panY - point[1]*view.pixels,
  ];
}
export function screenToWorld(view, pixel, width, height) {
  return [
    (pixel[0] - width/2 - view.panX)/view.pixels,
    -(pixel[1] - height/2 - view.panY)/view.pixels,
  ];
}
export function zoomViewport(view, factor, anchorX, anchorY, width, height) {
  const nextPixels=Math.max(0.00001,Math.min(100000,view.pixels*factor));
  const ratio=nextPixels/view.pixels;
  return {
    pixels:nextPixels,
    panX:anchorX-width/2-(anchorX-width/2-view.panX)*ratio,
    panY:anchorY-height/2-(anchorY-height/2-view.panY)*ratio,
  };
}
export function fitViewport(points, width, height) {
  if(!points.length) return {pixels:54,panX:0,panY:0};
  const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
  const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
  const pixels=Math.max(0.00001,Math.min(100000,
    Math.min((width-120)/Math.max(.01,maxX-minX),(height-105)/Math.max(.01,maxY-minY))));
  return {
    pixels,
    panX:-(minX+maxX)*pixels/2,
    panY:(minY+maxY)*pixels/2,
  };
}
export function niceGridStep(pixelsPerUnit) {
  const desired=67/Math.max(1e-10,pixelsPerUnit);
  const power=Math.pow(10,Math.floor(Math.log10(desired)));
  const options=[1,2,5,10].map(n=>n*power);
  return options.reduce((best,n)=>
    Math.abs(Math.log(n/desired))<Math.abs(Math.log(best/desired))?n:best,options[0]);
}
