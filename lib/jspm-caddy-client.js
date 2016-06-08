import _ from 'lodash';
import reload, {reloadCss} from './reloader.js';

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
    if (_.startsWith(event.data, 'data: ')) {
      const filePath = _.trimStart(event.data, 'data: ');
      if (_.endsWith(filePath, '.css')) {
        reloadCss(filePath);
      } else {
        reload(filePath);
      }
    } else {
      console.debug(event.data, 'data: ');
    }
  };

  watcher.onclose = function () {
    console.debug('[watcher] websocket connection closed.');
  };
};

export default watch;
