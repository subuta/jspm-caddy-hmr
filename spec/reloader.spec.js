import reloader from 'lib/reloader.js';
import app from 'example/app.js';

describe('Array', function(){
  beforeEach(function(){
    System.bundles = {
      "build.js": [
        "example/app.js",
        "example/nested/sample.css!github:systemjs/plugin-css@0.1.22/css.js",
        "github:systemjs/plugin-css@0.1.22.json",
        "example/nested/example.js",
        "example/nested/test.js"
      ]
    };
  });

  describe('sample', function(){
    it('should return the truth', function(){
      // console.log(System.loads);
      reloader('example/app.js');
    });
  });
});
