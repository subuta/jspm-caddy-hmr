// import lodash functions.
import startsWith from 'lodash/startsWith.js';
import endsWith from 'lodash/endsWith.js';
import first from 'lodash/first.js';
import keys from 'lodash/keys.js';
import includes from 'lodash/includes.js';
import each from 'lodash/each.js';
import pullAll from 'lodash/pullAll.js';
import last from 'lodash/last.js';
import map from 'lodash/map.js';
import reject from 'lodash/reject.js';
import reduce from 'lodash/reduce.js';
import intersection from 'lodash/intersection.js';
import some from 'lodash/some.js';
import isEmpty from 'lodash/isEmpty.js';
import reverse from 'lodash/reverse.js';
import flattenDeep from 'lodash/flattenDeep.js';
import uniq from 'lodash/uniq.js';

import { dirname, resolve } from './path.js';

const System = window.System;

// turn on this option to throw error on file not found.
const isStrict = false;

let waitsForImport = [];
const reload = (path) => {
  // when loader needed.
  if (!endsWith(path, '.js')) {
    path = path + '!';
  }

  const bundleFileName = first(keys(System.bundles));
  const bundleSetting = System.bundles[bundleFileName];

  // is bundle file changes(eg: build.js)
  const isBundleFile = path === bundleFileName || startsWith(path, bundleFileName);

  const url = normalizeSync(path);

  // is bundled file changes
  const isBundled = includes(bundleSetting, url);

  let promise = Promise.resolve();

  if (isBundled) {
    // delete related module.(includes module itself)
    const dependencies = getDependencyTree(url);
    each(dependencies, (dependency, moduleUrl) => {
      deleteWithHook(moduleUrl);
      waitsForImport.push(moduleUrl);
    });
    // remove already deleted modules from parents.
    let parentModules = pullAll(traceToRootModule(url), waitsForImport);
    // delete modules
    each(parentModules, moduleUrl => deleteWithHook(moduleUrl));
    // schedule root module for import.
    if (last(parentModules)) {waitsForImport.push(first(parentModules));}
  } else {
    promise = reImport(url);
  }

  if(isBundleFile) {
    // import module.
    let promises = map(waitsForImport, (moduleUrl) => {
      // delete and re-import module.
      console.debug(moduleUrl, ' re-imported.');
      return importWithHook(moduleUrl);
    });
    promise = Promise.all(promises);
    waitsForImport = [];
  }

  return promise;
};

const isJspmPackage = key => startsWith(key, `${location.origin}\/jspm_packages`);

export const getDependencyTree = (url) => {
  // ignore jspm_packages.
  const moduleUrls = reject(keys(System.loads), isJspmPackage);
  return reduce(moduleUrls, (result, moduleUrl) => {
    const { deps } = System.loads[moduleUrl];
    const isDependsOn = some(deps, dep => normalizeSync(dep, moduleUrl) === url);
    // module itself or module as a dependency
    if (url === moduleUrl || isDependsOn) {
      result[moduleUrl] = map(deps, dep => normalizeSync(dep, moduleUrl));
    }
    return result;
  }, {});
};

window.getDependencyTree = getDependencyTree;

export const traceToRootModule = (url, result = []) => {
  // ignore jspm_packages.
  const tree = getDependencyTree(url);

  const parentModuleUrls = reduce(tree, (results, dependencies, key) => {
    if (some(dependencies, dependency => dependency === url)) {
      results.push(key);
    }
    return results;
  }, []);

  // stop at circular reference.
  const isCircular = intersection(result, parentModuleUrls).length > 0;

  if (isCircular || isEmpty(parentModuleUrls)) {
    // reverse order(from `child -> parent` to `parent -> child`)
    return reverse(result);
  } else if (parentModuleUrls.length === 1) {
    const parentModuleUrl = parentModuleUrls[0];
    return traceToRootModule(parentModuleUrl, [...result, parentModuleUrl]);
  } else if (parentModuleUrls.length > 1) {
    // recursively searches dependencies and return flattened and unique results.
    const moduleDependencies = map(parentModuleUrls, parentModuleUrl => {
      return traceToRootModule(parentModuleUrl, [...result, parentModuleUrl]);
    });
    // flatten array and make each dependencies unique.
    return uniq(flattenDeep(moduleDependencies));
  }
};

window.traceToRootModule = traceToRootModule;

// delete module with hook.
export const deleteWithHook = (url) => {
  if (url && System.has(url)) {
    // call unload of module before delete
    const module = System.get(url);
    module._unload && module._unload();
    return System.delete(url);
  } else {
    if (isStrict) {
      throw new Error(`Failed to delete. because file(${url}) not imported yet.`);
    } else {
      console.debug(`Failed to delete. because file(${url}) not imported yet.`);
    }
  }
};

// import module with hook.
export const importWithHook = (url) => {
  return System.import(url).then((nextModule) => {
    // call reload of module after import
    nextModule._reload && nextModule._reload();
    return nextModule;
  }, error => {
    if (isStrict) {
      throw error;
    } else {
      console.warn(`Failed to import file:(${url}), error = `, error);
    }
  });
};

// ignore `Synchronous conditional normalization not supported sync normalizing` Error.
const normalizeSyncWithConditional = (path) => {
  let normalizedUrl = path;
  try {
    normalizedUrl = System.normalizeSync(path);
  } catch (error) {
    const isConditionalError = includes(error.message, 'Synchronous conditional normalization not supported sync normalizing');
    if (!isConditionalError && isStrict) {
      throw error;
    } else if (!isConditionalError) {
      console.warn(error);
    } else {
      console.debug(error);
    }
  }
  return normalizedUrl;
};

export const normalizeSync = (path, basePath) => {
  const normalizedUrl = normalizeSyncWithConditional(path);

  // if system has that module then return immediately.
  if (System.has(normalizedUrl)) return normalizedUrl;

  // return if path is jspm package.
  if (isJspmPackage(normalizedUrl)) return normalizedUrl;

  let url = normalizedUrl;

  if (basePath && endsWith(path, '.js')) {
    basePath = basePath.replace(location.origin, '');
    if (endsWith(basePath, '.js')) {
      basePath = dirname(basePath);
    }

    if (startsWith(path, '.')) {
      const resolvedPath = resolve(basePath, path);
      url = `${location.origin}${resolvedPath}`;
    } else {
      url = `${location.origin}${resolve(path)}`;
    }
  }

  if (!endsWith(url, '.js')) {
    url += '.js'
  }
  return url;
};

window.normalizeSync = normalizeSync;

// delete and re-import module.
const reImport = (url) => {
  // re-import only if script already loaded by system-js
  deleteWithHook(url);
  return importWithHook(url);
};

// reload module.
export default reload;
