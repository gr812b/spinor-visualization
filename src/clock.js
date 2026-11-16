import { cAbs, cArg } from './math/complex.js';
// Lightweight 2D clock component showing magnitude and phase for a complex number
export class Clock {
  constructor(container, label) {
    this.el = document.createElement('div');
    this.el.className = 'clock-card';
    this.el.innerHTML = `<div class="label">${label}</div><canvas class="clock-canvas"></canvas>`;
    container.appendChild(this.el);
    this.canvas = this.el.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.dpr = window.devicePixelRatio || 1;
    this.value = { re: 1, im: 0 };
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    this.draw();
  }

  setComplex(c) {
    this.value = c;
    this.draw();
  }

  draw() {
    if (!this.ctx || !this.value) return;
    const ctx = this.ctx; const w = this.canvas.width/this.dpr; const h = this.canvas.height/this.dpr;
    ctx.clearRect(0,0,w,h);
    const cx = w/2, cy = h/2;
    const baseR = Math.min(w,h)/2 - 12;
    const mag = cAbs(this.value);
    const displayR = baseR * Math.max(0, Math.min(1, mag));
    // faint guide circle at maximum size
    ctx.beginPath(); ctx.arc(cx,cy,baseR,0,Math.PI*2); ctx.strokeStyle='rgba(204,223,255,0.22)'; ctx.lineWidth=2; ctx.stroke();
    // actual clock sized by magnitude, allowed to reach 0
    if (displayR > 0) {
      ctx.beginPath(); ctx.arc(cx,cy,displayR,0,Math.PI*2); ctx.strokeStyle='#81b2ff'; ctx.lineWidth=3; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,displayR*0.9,0,Math.PI*2); ctx.fillStyle='rgba(105,164,253,0.08)'; ctx.fill();
    }
    // hand for phase
    const phase = cArg(this.value);
    if (displayR > 0) {
      const visualPhase = -phase;
      const hx = cx + Math.cos(visualPhase) * (displayR - 10);
      const hy = cy + Math.sin(visualPhase) * (displayR - 10);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(hx,hy); ctx.strokeStyle='#e6f0ff'; ctx.lineWidth=3; ctx.stroke();
    }
    // center dot
    ctx.beginPath(); ctx.arc(cx,cy,4,0,Math.PI*2); ctx.fillStyle='#e6f0ff'; ctx.fill();
    // numeric overlay
    ctx.fillStyle='#e6f0ff'; ctx.font='12px system-ui'; ctx.fillText(`|z|=${mag.toFixed(2)}`,8,h-28);
    ctx.fillText(`arg=${(phase).toFixed(2)} rad`,8,h-12);
  }
}
