import deepNested from './deepNested/index.js';

export const _reload = () => {
  console.log('reloaded: nested');
};

console.log('nested loaded.');

export default () => {
  return deepNested();
};
