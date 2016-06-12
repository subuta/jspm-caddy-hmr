import _ from 'lodash';
import { dirname, resolve } from './path.js';

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
  const isBundled = _.includes(bundleSetting, url);

  let promise;

  if(isBundleFile) {
    let promises = _.map(waitsForBundle, (bundleFilePath) => {
      // delete and re-import module.
      console.debug(bundleFilePath, ' re-imported!');
      return reImport(bundleFilePath);
    });
    waitsForBundle = [];
    promise = Promise.all(promises);
  }

  if (isBundled) {
    // ignore bundled file changes
    // because bundleFile change will coming soon.
    waitsForBundle.push(url);
    const dependencies = getDependencyTree(path);
    // console.log('dependencies = ', dependencies);
    promise = Promise.resolve();
  } else {
    promise = reImport(url);
  }

  return promise;
};

const isJspmPackage = key => _.startsWith(key, `${location.origin}\/jspm_packages`);

export const getDependencyTree = (path) => {
  // ignore jspm_packages.
  const url = normalizeSync(path);
  const moduleUrls = _.reject(_.keys(System.loads), isJspmPackage);
  return _.reduce(moduleUrls, (result, moduleUrl) => {
    const { deps } = System.loads[moduleUrl];
    const isDependsOn = _.some(deps, dep => normalizeSync(dep, moduleUrl) === url);
    // module itself or module as a dependency
    if (url === moduleUrl || isDependsOn) {
      result[moduleUrl] = _.map(deps, dep => normalizeSync(dep, moduleUrl));
    }
    return result;
  }, {});
};

// delete module with hook.
export const deleteWithHook = (url) => {
  if (url && System.has(url)) {
    // call unload of module before delete
    const module = System.get(url);
    module._unload && module._unload();
    return System.delete(url);
  } else {
    throw new Error(`Failed to delete. because file(${url}) not imported yet.`);
  }
};

export const normalizeSync = (path, basePath) => {
  const normalizedUrl = System.normalizeSync(path);
  let url = normalizedUrl;

  // return if path is jspm package.
  if (isJspmPackage(normalizedUrl)) return normalizedUrl;

  if (basePath && _.endsWith(path, '.js')) {
    const normalizedPath = normalizedUrl.replace(location.origin, '');
    // if normalizedPath is relative
    basePath = basePath.replace(location.origin, '');
    if (_.endsWith(basePath, '.js')) {
      basePath = dirname(basePath);
    }

    if (_.startsWith(path, '.')) {
      const resolvedPath = resolve(basePath, `.${normalizedPath}`);
      url = `${location.origin}${resolvedPath}`;
    } else {
      url = `${location.origin}${normalizedPath}`;
    }
  }

  if (!_.endsWith(url, '.js')) {
    url += '.js'
  }
  return url;
};

// delete and re-import module.
const reImport = (url) => {
  // re-import only if script already loaded by system-js
  deleteWithHook(url);
  return System.import(url).then((nextModule) => {
    // call reload of module after import
    nextModule._reload && nextModule._reload();
    return nextModule;
  });
};

// reload module.
export default reload;
