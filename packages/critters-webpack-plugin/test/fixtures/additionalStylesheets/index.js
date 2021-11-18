import './style.css';

document.body.appendChild(document.createTextNode('this counts as SSR'));

import('./chunk.js').then();
