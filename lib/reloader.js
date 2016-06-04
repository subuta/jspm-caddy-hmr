import findKey from 'lodash-es/findKey';
import includes from 'lodash-es/includes';
import first from 'lodash-es/first';
import keys from 'lodash-es/keys';
import startsWith from 'lodash-es/startsWith';
import each from 'lodash-es/each';
import trim from 'lodash-es/trim';

const System = window.System;

let waitsForBundle = [];
const reload = (path) => {
  console.debug('will reload = ', path);
  const fullPath = findKey(System.loads, (value, key) => {
    return includes(key, path);
  });

  const bundleFileName = first(keys(System.bundles));
  const bundleSetting = System.bundles[bundleFileName];

  // is bundle file changes(eg: build.js)
  const isBundleFile = startsWith(path, bundleFileName);
  // is bundled file changes
  const isBundled = includes(bundleSetting, fullPath);

  if (isBundled) {
    // ignore bundled file changes
    // because bundleFile change will coming soon.
    waitsForBundle.push(fullPath);
  } else {
    reImport(fullPath);
  }

  if(isBundleFile) {
    reImport(fullPath);

    each(waitsForBundle, (bundleFilePath) => {
      // delete and re-import module.
      reImport(bundleFilePath);
      console.debug(bundleFilePath, ' re-imported!');
    });

    waitsForBundle = [];
  }
};

// delete and re-import module.
const reImport = (fullPath) => {
  System.delete(fullPath);
  System.import(fullPath);
};

export const reloadCss = (path) => {
  // work around for https://github.com/systemjs/plugin-css/issues/81
  // remove duplicated dom nodes.
  const linkTo = trim(path, '!');
  const styleNodes = document.querySelectorAll(`link[href*="${linkTo}"]`);
  each(styleNodes, node => {
    node.parentNode.removeChild(node);
  });

  reload(path)
};

// reload module.
export default reload;
