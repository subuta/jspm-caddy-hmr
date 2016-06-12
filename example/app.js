// js example.
import nested from 'example/nested/index.js';
// css example.
import 'example/sample.css!';

const render = () => {
  const container = document.querySelector('#app-container');
  container.innerHTML = nested();
};

export const _reload = () => {
  console.log('reloaded: app');
  render();
};

console.log('app loaded!');

render();
