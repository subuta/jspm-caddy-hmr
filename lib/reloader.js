import _ from 'lodash';

const System = window.System;

let waitsForBundle = [];
const reload = (path) => {
  console.debug('will reload = ', path);
  const fullPath = _.findKey(System.loads, (value, key) => {
    return _.includes(key, path);
  });

  const bundleFileName = _.first(_.keys(System.bundles));
  const bundleSetting = System.bundles[bundleFileName];

  // is bundle file changes(eg: build.js)
  const isBundleFile = _.startsWith(path, bundleFileName);
  // is bundled file changes
  const isBundled = _.includes(bundleSetting, fullPath);

  if (isBundled) {
    // ignore bundled file changes
    // because bundleFile change will coming soon.
    waitsForBundle.push(fullPath);
  } else {
    reImport(fullPath);
  }

  if(isBundleFile) {
    reImport(fullPath);

    _.each(waitsForBundle, (bundleFilePath) => {
      // delete and re-import module.
      reImport(bundleFilePath);
      console.debug(bundleFilePath, ' re-imported!');
    });

    waitsForBundle = [];
  }
};

// delete and re-import module.
const reImport = (fullPath) => {
  // re-import only if script already loaded by system-js
  if (fullPath && System.has(fullPath)) {
    System.delete(fullPath);
    System.import(fullPath);
  }
};

export const reloadCss = (path) => {
  // work around for https://github.com/systemjs/plugin-css/issues/81
  // remove duplicated dom nodes.
  const linkTo = _.trim(path, '!');
  const styleNodes = document.querySelectorAll(`link[href*="${linkTo}"]`);
  _.each(styleNodes, node => {
    node.parentNode.removeChild(node);
  });

  reload(path)
};

// reload module.
export default reload;
