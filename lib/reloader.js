import _ from 'lodash';
import { dirname, resolve } from './path.js';

const System = window.System;

// turn on this option to throw error on file not found.
const isStrict = false;

let waitsForImport = [];
const reload = (path) => {
  // when loader needed.
  if (!_.endsWith(path, '.js')) {
    path = path + '!';
  }

  const bundleFileName = _.first(_.keys(System.bundles));
  const bundleSetting = System.bundles[bundleFileName];

  // is bundle file changes(eg: build.js)
  const isBundleFile = path === bundleFileName || _.startsWith(path, bundleFileName);

  const url = normalizeSync(path);

  // is bundled file changes
  const isBundled = _.includes(bundleSetting, url);

  let promise;

  if (isBundled) {
    // delete related module.(includes module itself)
    const dependencies = getDependencyTree(url);
    _.each(dependencies, (dependency, moduleUrl) => {
      deleteWithHook(moduleUrl);
      waitsForImport.push(moduleUrl);
    });
    // remove already deleted modules from parents.
    let parentModules = _.pullAll(traceToRootModule(url), waitsForImport);
    // delete modules
    _.each(parentModules, moduleUrl => deleteWithHook(moduleUrl));
    // schedule root module for import.
    if (_.last(parentModules)) {waitsForImport.push(_.last(parentModules));}
    promise = Promise.resolve();
  } else {
    promise = reImport(url);
  }

  if(isBundleFile) {
    // import module.
    let promises = _.map(waitsForImport, (moduleUrl) => {
      // delete and re-import module.
      console.debug(moduleUrl, ' re-imported.');
      return importWithHook(moduleUrl);
    });
    promise = Promise.all(promises);
    waitsForImport = [];
  }

  return promise;
};

const isJspmPackage = key => _.startsWith(key, `${location.origin}\/jspm_packages`);

export const getDependencyTree = (url) => {
  // ignore jspm_packages.
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

export const traceToRootModule = (url, result = []) => {
  // ignore jspm_packages.
  const tree = getDependencyTree(url);
  const parentModuleUrl = _.findKey(tree, (dependencies) => {
    return _.some(dependencies, dependency => dependency === url);
  });

  if (parentModuleUrl) {
    result.push(parentModuleUrl);
    return traceToRootModule(parentModuleUrl, result);
  } else {
    return result;
  }
};

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

export const normalizeSync = (path, basePath) => {
  const normalizedUrl = System.normalizeSync(path);

  // if system has that module then return immediately.
  if (System.has(normalizedUrl)) return normalizedUrl;

  // return if path is jspm package.
  if (isJspmPackage(normalizedUrl)) return normalizedUrl;

  let url = normalizedUrl;

  if (basePath && _.endsWith(path, '.js')) {
    basePath = basePath.replace(location.origin, '');
    if (_.endsWith(basePath, '.js')) {
      basePath = dirname(basePath);
    }

    if (_.startsWith(path, '.')) {
      const resolvedPath = resolve(basePath, path);
      url = `${location.origin}${resolvedPath}`;
    } else {
      url = `${location.origin}${path}`;
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
  return importWithHook(url);
};

// reload module.
export default reload;
