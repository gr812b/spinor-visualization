import { DEMOS } from '../math/equations.js';

const target = document.querySelector('[data-app-nav]');
if (target) {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  const nav = document.createElement('nav');
  nav.className = 'app-navigation';
  const brand = document.createElement('a');
  brand.className = 'brand';
  brand.href = 'index.html';
  brand.textContent = 'Math, seen';
  nav.append(brand);

  const links = [
    { href: 'index.html', label: 'All demos' },
    ...DEMOS.map(d => ({ href: d.href, label: d.title })),
    { href: 'equations.html', label: 'Equation library' },
  ];
  for (const link of links) {
    const a = document.createElement('a');
    a.href = link.href;
    a.className = 'nav-link' + (link.href === current ? ' active' : '');
    a.textContent = link.label;
    if (link.href === current) a.setAttribute('aria-current', 'page');
    nav.append(a);
  }
  target.append(nav);
}
