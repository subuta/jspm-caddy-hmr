import reload, {reImport} from 'lib/reloader.js';
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

  it('should throws error with not imported file', function(){
    assert.isRejected(reload('example/not-exsits.js'), /Failed to reload\. because file\(.*\) not imported yet./);
  });

  it('should remove old dom on reload css file', function(done){
    const path = 'example/nested/sample.css!';
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

  it('should throws error with not imported css file', function(){
    assert.isRejected(reload('example/nested/not-exists.css!'), /Failed to reload\. because file\(.*\) not imported yet./);
  });

  it('should not call import of single file if bundled', function(done){
    System.bundles = {
      "build.js": [
        "example/app.js",
        "example/nested/sample.css!github:systemjs/plugin-css@0.1.22/css.js",
        "github:systemjs/plugin-css@0.1.22.json",
        "example/nested/example.js",
        "example/nested/test.js"
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
});
