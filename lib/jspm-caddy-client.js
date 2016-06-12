import _ from 'lodash';
import reload, {
  normalizeSync,
  importWithHook,
  deleteWithHook
} from './reloader.js';

// replace all console.debug to noop.
const isDebug = false;
console.debug = isDebug ? console.debug : _.noop;

const watch = (watcherPath, port) => {
  const sanitizedPath = _.trimStart(watcherPath, '/');

  var watcher;
  if (port) {
    watcher = new WebSocket(`ws://${location.hostname}:${port}/${sanitizedPath}`);
  } else {
    watcher = new WebSocket(`ws://${location.host}/${sanitizedPath}`);
  }

  watcher.onopen = function (event) {
    console.debug('[watcher] websocket connection opened');
  };

  watcher.onmessage = function (event) {
    if (_.startsWith(event.data, 'data:')) {
      const [_, type, filePath] = event.data.split(':');
      console.debug(`type = ${type}, filePath = ${filePath}`);
      const url = normalizeSync(filePath);
      if (type === 'changed') {
        reload(filePath);
      } else if (type === 'added') {
        importWithHook(url);
      } else if (type === 'deleted') {
        deleteWithHook(url);
      }
    } else {
      console.debug(event.data);
    }
  };

  watcher.onclose = function () {
    console.debug('[watcher] websocket connection closed.');
  };
};

export default watch;
