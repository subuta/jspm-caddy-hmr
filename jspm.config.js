SystemJS.config({
  paths: {
    "jspm-caddy-hmr/": "lib/"
  },
  browserConfig: {
    "paths": {
      "npm:": "/jspm_packages/npm/",
      "github:": "/jspm_packages/github/"
    }
  },
  transpiler: "plugin-babel",
  packages: {
    "jspm-caddy-hmr": {
      "main": "lib/jspm-caddy-client.js",
      "meta": {
        "*.js": {
          "loader": "plugin-babel"
        }
      }
    }
  },
  map: {
    "plugin-babel": "npm:systemjs-plugin-babel@0.0.12"
  }
});

SystemJS.config({
  packageConfigPaths: [
    "npm:@*/*.json",
    "npm:*.json",
    "github:*/*.json"
  ],
  map: {
    "css": "github:systemjs/plugin-css@0.1.22",
    "lodash-es": "npm:lodash-es@4.13.1"
  },
  packages: {}
});
