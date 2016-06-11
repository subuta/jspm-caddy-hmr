import _ from 'lodash';

const System = window.System;

let waitsForBundle = [];
const reload = (path) => {
  console.debug('will reload = ', path);
  const bundleFileName = _.first(_.keys(System.bundles));
  const bundleSetting = System.bundles[bundleFileName];

  // is bundle file changes(eg: build.js)
  const isBundleFile = path === bundleFileName || _.startsWith(path, bundleFileName);

  const url = normalizeSync(path);

  // is bundled file changes
  const isBundled = _.includes(bundleSetting, path);

  let promise;
  if (isBundled) {
    // ignore bundled file changes
    // because bundleFile change will coming soon.
    waitsForBundle.push(url);
    promise = Promise.resolve();
  } else {
    promise = reImport(url);
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

export const getDependencies = (path) => {
  const url = normalizeSync(path);
  const module = System.loads[url];
  return module ? module.deps : [];
};

export const getDependencyTree = (path) => {
  // ignore jspm_packages.
  const url = normalizeSync(path);
  const moduleUrls = _.reject(_.keys(System.loads), key => _.startsWith(key, `${location.origin}/jspm_packages`));
  return _.reduce(moduleUrls, (result, moduleUrl) => {
    // if (url === moduleUrl) {
    //   result[moduleUrl] = _.map(System.loads[moduleUrl].deps, dep => normalizeSync(dep));
    // } else if (_.some(System.loads[moduleUrl].deps, dep => normalizeSync(dep) === url)) {
    //   result[moduleUrl] = _.map(System.loads[moduleUrl].deps, dep => normalizeSync(dep));
    // }
    result[moduleUrl] = _.map(System.loads[moduleUrl].deps, dep => normalizeSync(dep));
    return result;
  }, {});
};

export const normalizeSync = (path) => {
  let url = System.normalizeSync(path);
  if (!_.endsWith(url, '.js')) {
    url += '.js'
  }
  return url;
};

// delete and re-import module.
const reImport = (url) => {
  // re-import only if script already loaded by system-js
  if (url && System.has(url)) {
    // call unload of module before delete
    const module = System.get(url);
    module._unload && module._unload();
    System.delete(url);

    return System.import(url).then((nextModule) => {
      // call reload of module after import
      nextModule._reload && nextModule._reload();
      return nextModule;
    });
  } else {
    const error = new Error(`Failed to reload. because file(${url}) not imported yet.`);
    return Promise.reject(error);
  }
};

// reload module.
export default reload;
