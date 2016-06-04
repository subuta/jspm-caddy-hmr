#!/usr/bin/env node

var program = require('commander');
var sane = require('sane');
var path = require('path');
var _ = require('lodash');

function list(val) {
  return val.split(',');
}

program
  .version('0.0.1')
  .usage('[options] <target>')
  .option('-e, --exclude <folders>', 'A list of folders to exclude from watch', list)
  .option('-i, --include <patterns>', 'A list of file-patterns to watch', list)
  .option('-v, --verbose', 'log verbose')
  .parse(process.argv);

process.stdin.setEncoding('utf8');

// files to watch.
var include = [
  '**/*.js',
  '**/*.css'
];

// join include.
if (program.include) {
  include = include.concat(program.include);
}

// files to ignore.
var exclude = [
  'jspm_packages',
  'node_modules',
  'jspm.config.js',
  'watchServer.js'
];

// join exclude.
if (program.exclude) {
  exclude = exclude.concat(program.exclude);
}

// path to watch
var target = program.args[0] ? path.resolve(process.cwd(), program.args[0]) : process.cwd();

// if verbose not specified supress log.
if (!program.verbose) {
  console.log = _.noop;
}

// TODO: FIX `Watchman was not found in PATH.` on caddy.
var watchman = false;
var watcher = sane(target, {
  glob: include,
  watchman: watchman
});

watcher.on('ready', function () {
  console.log(`[jspm-caddy-hmr:server] ready ${watchman ? 'with watchman' : ''}`)
});

watcher.on('add', function (filepath, root, stat) {
  console.log('[jspm-caddy-hmr:server] file added', filepath);
});

watcher.on('delete', function (filepath, root) {
  console.log('[jspm-caddy-hmr:server] file deleted', filepath);
});

watcher.on('change', function (filepath, root, stat) {
  const isNotBlackListed = _.every(exclude, path => {
    return !_.startsWith(filepath, path);
  });

  if (isNotBlackListed) {
    console.log('[jspm-caddy-hmr:server] file changed', filepath);
    // explicit write to stdout.
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
