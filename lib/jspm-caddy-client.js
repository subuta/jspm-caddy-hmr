import noop from 'lodash-es/noop';
import startsWith from 'lodash-es/startsWith';
import endsWith from 'lodash-es/endsWith';
import trimStart from 'lodash-es/trimStart';
import reload, {reloadCss} from 'jspm-caddy-client/reloader.js';

// replace all console.debug to noop.
const isDebug = false;
console.debug = isDebug ? console.debug : noop;

const watch = (watcherPath, port) => {
  const sanitizedPath = trimStart(watcherPath, '/');

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
    if (startsWith(event.data, 'data: ')) {
      const filePath = trimStart(event.data, 'data: ');
      if (endsWith(filePath, '.css')) {
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
