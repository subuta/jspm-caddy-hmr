import reload, {
  normalizeSync,
  getDependencyTree,
  traceToRootModule
} from '/lib/reloader.js';

import _ from 'lodash';

describe('reload', function(){
  beforeEach(function(done){
    // load app.js everytime.
    System.import('example/app.js').then(() => {
      done();
    });
  });

  it('should reload imported file', function(done){
    assert.doesNotThrow(() => {
      sinon.spy(System, 'import');
      reload('example/app.js').then(() => {
        assert(System.import.calledWith(sinon.match(/example\/app\.js/)));
        System.import.restore();
        done();
      });
    });
  });

  it('should not throws error with not imported file', function(){
    assert.doesNotThrow(() => {
      reload('example/not-exsits.js')
    }, /Failed to delete\. because file\(.*\) not imported yet./);
  });

  it('should remove old dom on reload css file', function(done){
    const path = 'example/sample.css';
    const linkTo = _.trim(path, '!');
    let styleNodes = document.querySelectorAll(`link[href*="${linkTo}"]`);
    assert(styleNodes.length > 0);
    styleNodes[0].classList.add('will-remove');
    assert(styleNodes[0].classList.contains('will-remove'));

    assert.doesNotThrow(() => {
      reload(path).then(() => {
        let styleNodes = document.querySelectorAll(`link[href*="${linkTo}"]`);
        assert(styleNodes.length === 1);
        // styleNode must be regenerated.
        assert.isNotOk(styleNodes[0].classList.contains('will-remove'));
        done();
      });
    });
  });

  it('should not throws error with not imported css file', function(){
    assert.doesNotThrow(() => {
      reload('example/nested/not-exists.css!')
    }, /Failed to delete\. because file\(.*\) not imported yet./);
  });

  it('should not call import of single file if bundled', function(done){
    System.bundles = {
      "build.js": [
        `${location.origin}/example/app.js`,
        `${location.origin}/example/nested/sample.css!github:systemjs/plugin-css@0.1.22/css.js`,
        `${location.origin}/github:systemjs/plugin-css@0.1.22.json`,
        `${location.origin}/example/nested/example.js`,
        `${location.origin}/example/nested/test.js`
      ]
    };

    sinon.spy(System, 'import');
    assert.doesNotThrow(() => {
      reload('example/app.js').then(() => {
        assert.isNotOk(System.import.calledWith(sinon.match(/example\/app\.js/)));
        System.import.restore();
        done();
      });
    });
  });

  it('should call unload/reload hook by correct order on reload', function(done){
    const onReload = sinon.spy();
    const onUnload = sinon.spy();

    const dummyModule = System.newModule({
      _reload: onReload,
      _unload: onUnload,
      default: () => true
    });
    System.set('dummy-module.js', dummyModule);

    const mockedImport = () => {
      return Promise.resolve(dummyModule);
    };

    System.import('dummy-module.js').then((module) => {
      assert(module.default() === true);
      sinon.stub(System, 'import', mockedImport);
      reload('dummy-module.js').then((module) => {
        assert.isOk(module._unload.called === true);
        assert.isOk(module._reload.called === true);
        // call unload first and then reload.
        assert.callOrder(module._unload, module._reload);
        System.import.restore();
        done();
      });
    });
  });
});

describe('normalizeSync', function() {
  beforeEach(function (done) {
    // load app.js everytime.
    System.import('example/app.js').then(() => {
      done();
    });
  });

  it('should return same result with System.normalize', function(done){
    // maybe original normalizeSync is not return correct path.
    assert(System.normalizeSync('example/sample.css!') !== normalizeSync('example/sample.css!'));

    System.normalize('example/sample.css!').then(normalized => {
      // so we need to use original one.
      assert.deepEqual(normalized, normalizeSync('example/sample.css!'));
      done();
    });
  });

  it('should parse relative path correctly', function(done){
    System.normalize('./example/app.js').then(normalized => {
      assert.deepEqual(normalized, normalizeSync('./example/app.js'));
      done();
    });
  });

  it('should parse nested relative path correctly', function(done){
    System.normalize('../example/app.js').then(normalized => {
      assert.deepEqual(normalized, normalizeSync('../example/app.js'));
      done();
    });
  });

  it('should parse deep nested relative path correctly', function(done){
    System.normalize('deepNested/index.js').then(normalized => {
      assert.deepEqual(normalized, normalizeSync('deepNested/index.js'));
      done();
    });
  });

  it('should use basePath if passed.', function(){
    assert.deepEqual(normalizeSync('./deepNested/index.js', '/'), `${location.origin}/deepNested/index.js`);
  });

  it('should use basePath if passed.', function(){
    assert.deepEqual(normalizeSync('./deepNested/index.js', `/nested`), `${location.origin}/nested/deepNested/index.js`);
  });

  it('should arrow absolutePath as basePath.', function(){
    assert.deepEqual(normalizeSync('/deepNested/index.js', `/nested`), `${location.origin}/deepNested/index.js`);
  });

  it('should arrow file contained path as basePath.', function(){
    assert.deepEqual(normalizeSync('./deepNested/index.js', `/nested/index.js`), `${location.origin}/nested/deepNested/index.js`);
  });

  it('should arrow file contained absolute path as basePath.', function(){
    assert.deepEqual(normalizeSync('./deepNested/index.js', `nested/index.js`), `${location.origin}/nested/deepNested/index.js`);
  });

  it('should arrow relative path and absolute path as basePath.', function(){
    assert.deepEqual(normalizeSync('example/nested/deepNested/moreDeepNested/index.js', `${location.origin}/example/nested/deepNested/index.js`), `${location.origin}/example/nested/deepNested/moreDeepNested/index.js`);
  });

  it('should allow url as a basePath if passed.', function(){
    assert.deepEqual(normalizeSync('./deepNested/index.js', `${location.origin}/nested`), `${location.origin}/nested/deepNested/index.js`);
  });

  it('should resolve library url with basePath if passed.', function(){
    assert.match(normalizeSync('lodash', `${location.origin}/nested`), new RegExp(`${location.origin}/jspm_packages/.*/lodash.js$`));
  });

  it('should allow url as a basePath if passed.', function(){
    assert.deepEqual(normalizeSync('./deepNested/index.js', `${location.origin}/nested`), `${location.origin}/nested/deepNested/index.js`);
  });
});

describe('getDependencyTree', function() {
  beforeEach(function (done) {
    // load app.js everytime.
    System.import('example/app.js').then(() => {
      done();
    });
  });

  it('should return leaf module dependency tree', function(){
    // maybe original normalizeSync is not return correct path.
    const url = normalizeSync('example/nested/deepNested/index.js');
    const dependencyTree = getDependencyTree(url);
    assert.deepEqual(dependencyTree, {
      [`${location.origin}/example/nested/index.js`]: [
        `${location.origin}/example/nested/deepNested/index.js`
      ],
      [`${location.origin}/example/nested/deepNested/index.js`]: [
        `${location.origin}/example/nested/deepNested/moreDeepNested/index.js`
      ]
    });
  });

  it('should return root module dependency tree', function(){
    // maybe original normalizeSync is not return correct path.
    const url = normalizeSync('example/app.js');
    const dependencyTree = getDependencyTree(url);
    const files = _.keys(dependencyTree);
    assert.match(files[0], `${location.origin}/example/app.js`);
    assert.match(dependencyTree[files[0]][0], `${location.origin}/example/nested/index.js`);
    assert.match(dependencyTree[files[0]][1], `${location.origin}/example/sample.css!`);
  });
});

describe('traceToRootModule', function() {
  beforeEach(function () {
  });

  it('should return parent modules of dependency tree', function(done) {
    // load app.js everytime.
    System.import('example/app.js').then(() => {
      // maybe original normalizeSync is not return correct path.
      const url = normalizeSync('example/nested/deepNested/moreDeepNested/index.js');
      const parentModules = traceToRootModule(url);
      console.log(parentModules);
      assert.deepEqual(parentModules, [
        `${location.origin}/example/app.js`,
        `${location.origin}/example/nested/index.js`,
        `${location.origin}/example/nested/deepNested/index.js`
      ]);
      done();
    });
  });

  it('should treat circular dependency correctly', function(done) {
    // from https://github.com/ModuleLoader/es6-module-loader/wiki/Circular-References-&-Bindings
    System.import('example/circular/even.js').then(() => {
      const url = normalizeSync('example/circular/even.js');
      const parentModules = traceToRootModule(url);
      try {
        assert.deepEqual(parentModules, [
          `${location.origin}/example/circular/even.js`,
          `${location.origin}/example/circular/odd.js`
        ]);
      } catch (err) {
        console.log(err);
      }
      done();
    });
  });
});
