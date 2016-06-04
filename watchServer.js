var sane = require('sane');
var onKillSignal = require('death');
var _ = require('lodash');

process.stdin.setEncoding('utf8');

// files to ignore.
var blackList = [
  'jspm_packages',
  'node_modules',
  'jspm.config.js',
  'watchServer.js'
];

// TODO: FIX `Watchman was not found in PATH.` on caddy.
var watchman = false;
var watcher = sane(__dirname, {
  glob: [
    '**/*.js',
    '**/*.css'
  ],
  watchman: watchman
});

watcher.on('ready', function () {
  console.log(`[watchServer]ready ${watchman ? 'with watchman' : ''}`)
});

watcher.on('add', function (filepath, root, stat) {
  console.log('[watchServer]file added', filepath);
});

watcher.on('delete', function (filepath, root) {
  console.log('[watchServer]file deleted', filepath);
});

watcher.on('change', function (filepath, root, stat) {
  const isNotBlackListed = _.every(blackList, path => {
    return !_.startsWith(filepath, path);
  });

  if (isNotBlackListed) {
    // explicit write to stdout.
    console.log('file changed', filepath);
    process.stdout.write('data: ' + filepath + '\n');
  }
});

process.stdin.on('readable', function() {
  // read from stdin
  var chunk = process.stdin.read();
  if (chunk !== null) {
    // write to stdout
    process.stdout.write('data: ' + chunk);
  }
});

// on kill
onKillSignal(function() {
  console.log("Caught interrupt signal");
  // close watcher immediately.
  watcher.close();
  process.exit();
});
