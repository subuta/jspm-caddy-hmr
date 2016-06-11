SystemJS.config({
  baseURL: '/',
  paths: {
    'npm:': 'jspm_packages/npm/',
    'github:': 'jspm_packages/github/',
    'jspm-caddy-hmr/': 'lib/'
  },
  devConfig: {
    'map': {
      'plugin-babel': 'npm:systemjs-plugin-babel@0.0.12',
      'util': 'github:jspm/nodelibs-util@0.2.0-alpha',
      'path': 'github:jspm/nodelibs-path@0.2.0-alpha',
      'stream': 'github:jspm/nodelibs-stream@0.2.0-alpha',
      'process': 'github:jspm/nodelibs-process@0.2.0-alpha',
      'events': 'github:jspm/nodelibs-events@0.2.0-alpha',
      'assert': 'github:jspm/nodelibs-assert@0.2.0-alpha',
      'fs': 'github:jspm/nodelibs-fs@0.2.0-alpha'
    },
    'packages': {
      'github:jspm/nodelibs-stream@0.2.0-alpha': {
        'map': {
          'stream-browserify': 'npm:stream-browserify@2.0.1'
        }
      },
      'npm:stream-browserify@2.0.1': {
        'map': {
          'inherits': 'npm:inherits@2.0.1',
          'readable-stream': 'npm:readable-stream@2.1.4'
        }
      },
      'npm:readable-stream@2.1.4': {
        'map': {
          'inherits': 'npm:inherits@2.0.1',
          'isarray': 'npm:isarray@1.0.0',
          'process-nextick-args': 'npm:process-nextick-args@1.0.7',
          'util-deprecate': 'npm:util-deprecate@1.0.2',
          'core-util-is': 'npm:core-util-is@1.0.2',
          'string_decoder': 'npm:string_decoder@0.10.31',
          'buffer-shims': 'npm:buffer-shims@1.0.0'
        }
      }
    }
  },
  transpiler: 'plugin-babel',
  packages: {
    'jspm-caddy-hmr': {
      'main': 'lib/jspm-caddy-client.js',
      'meta': {
        '*.js': {
          'format': 'esm'
        }
      }
    }
  }
});

SystemJS.config({
  packageConfigPaths: [
    'npm:@*/*.json',
    'npm:*.json',
    'github:*/*.json'
  ],
  map: {
    'buffer': 'github:jspm/nodelibs-buffer@0.2.0-alpha',
    'css': 'github:systemjs/plugin-css@0.1.23',
    'lodash': 'npm:lodash@4.13.1'
  },
  packages: {
    'github:jspm/nodelibs-buffer@0.2.0-alpha': {
      'map': {
        'buffer-browserify': 'npm:buffer@4.6.0'
      }
    },
    'npm:buffer@4.6.0': {
      'map': {
        'ieee754': 'npm:ieee754@1.1.6',
        'base64-js': 'npm:base64-js@1.1.2',
        'isarray': 'npm:isarray@1.0.0'
      }
    }
  }
});
