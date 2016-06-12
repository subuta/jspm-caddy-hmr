// js example.
import nested from 'example/nested/index.js';
// css example.
import 'example/sample.css!';

const render = () => {
  const container = document.querySelector('body');
  container.innerHTML = nested();
};

export const _reload = () => {
  console.log('reloaded: app');
  render();
};

export const _unload = () => {
  console.log('unloaded: app');
  const container = document.querySelector('body');
  container.innerHTML = '';
};

console.log('app loaded!');

// Check if the DOMContentLoaded has already been completed
if (document.readyState === 'complete' || document.readyState !== 'loading') {
  render();
} else {
  document.addEventListener('DOMContentLoaded', render);
}
