import _ from 'lodash';

const System = window.System;

let waitsForBundle = [];
const reload = (path) => {
  console.debug('will reload = ', path);
  const bundleFileName = _.first(_.keys(System.bundles));
  const bundleSetting = System.bundles[bundleFileName];

  // is bundle file changes(eg: build.js)
  const isBundleFile = path === bundleFileName || _.startsWith(path, bundleFileName);

  const fullPath = _.findKey(System.loads, (value, key) => {
    return _.includes(key, path);
  }) || path;

  // is bundled file changes
  const isBundled = _.includes(bundleSetting, path);
  
  let promise;
  if (isBundled) {
    // ignore bundled file changes
    // because bundleFile change will coming soon.
    waitsForBundle.push(fullPath);
    promise = Promise.resolve();
  } else {
    promise = reImport(fullPath);
  }

  if(isBundleFile) {
    let promises = _.map(waitsForBundle, (bundleFilePath) => {
      // delete and re-import module.
      console.debug(bundleFilePath, ' re-imported!');
      return reImport(bundleFilePath);
    });
    waitsForBundle = [];
    promise = Promise.all(promises.push(promise));
  }

  return promise;
};

// delete and re-import module.
export const reImport = (fullPath) => {
  // re-import only if script already loaded by system-js
  if (fullPath && System.has(fullPath)) {
    const module = System.get(fullPath);
    module._unload && module._unload();
    System.delete(fullPath);
    return System.import(fullPath).then((nextModule) => {
      nextModule._reload && nextModule._reload();
      return nextModule;
    });
  } else {
    const error = new Error(`Failed to reload. because file(${fullPath}) not imported yet.`);
    return Promise.reject(error);
  }
};

// reload module.
export default reload;
