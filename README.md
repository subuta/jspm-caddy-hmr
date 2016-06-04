## jspm-caddy-watch
using this module, you will get.
- HMR with jspm bundle support(added from jspm v1.7~)
- No need to launch another file watcher(chokidar zombie process ...)

### Prerequisite
- Caddy
- jspm@beta

### how to install
```
npm install jspm@beta -g
brew install caddy
NODE_ENV=development npm i
jspm i
```

### how to use
1 add watcher-server to your Caddyfile

```
localhost:3000

gzip
browse
ext .html

websocket /watch "node watchServer.js"
```

2 add watcher-client to your index.html(or js)

```
<html>
<head>
    <script src="jspm_packages/system.js"></script>
    <script src="jspm.config.js"></script>
    <title>jspm-caddy-watchman</title>
</head>
<body>
<h1>hello jspm-caddy!</h1>
<script>
    if (location.origin.match(/localhost/)) {
        System.trace = true;
        System.import('jspm-caddy-watchman/watcher.js').then(function(Watcher){
          new Watcher.default('/watch');
        });
    }
    System.import('example/app.js');
</script>
</body>
</html>
```

### run example
```
npm run bundle
npm run serve
```
