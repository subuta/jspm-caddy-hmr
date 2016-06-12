import moreDeepNested from './moreDeepNested/index.js';

export const _reload = () => {
  console.log('reloaded: deepNested');
};

console.log('deepNested loaded.');

export default () => {
 return moreDeepNested();
}
