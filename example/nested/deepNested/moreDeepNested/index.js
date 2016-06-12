export const _reload = () => {
  console.log('reloaded: moreDeepNested');
};

console.log('moreDeepNested loaded.');

export default () => {
 return '<h1>Hello from nested module</h1>';
}
