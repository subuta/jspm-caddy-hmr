## jspm-caddy-hmr(WIP)
using this module, you will get.
- HMR with jspm bundle support(added from jspm v1.7~)
- Easy to use (No need to launch another file watcher process)
- Easy to understand (Dead simple structure)

### TODO
- reload on add/delete file

### Prerequisite
- Caddy
- jspm@beta

```
brew install caddy
npm install jspm@beta -g
```

### how to use
1 install jspm-caddy-hmr as a local node_module
```
npm install jspm-caddy-hmr --save-dev
```

2 add jspm-caddy-hmr(server) to your Caddyfile

```
localhost:3000

gzip
browse
ext .html

websocket /watch "node ./node_modules/.bin/jspm-caddy-hmr"
```

3 add jspm-caddy-client to your index.html(or in js)

```
<html>
<head>
    <script src="jspm_packages/system.js"></script>
    <script src="jspm.config.js"></script>
    <title>jspm-caddy-hmr</title>
</head>
<body>
<h1>hello jspm-caddy-hmr!</h1>
<script>
    if (location.origin.match(/localhost/)) {
        System.trace = true;
        System.import('jspm-caddy-hmr').then(function(Watcher){
          new Watcher.default('/watch');
        });
    }
    System.import('example/app.js');
</script>
</body>
</html>
```

if you want to keep file-watcher process separated,
you can use websocketd instead like below.

```
websocketd --port=8080 jspm-caddy-hmr

and specify watcher port explicitly.

new Watcher.default('/', 8080);
```

---

### how to develop
```
npm install jspm@beta -g
brew install caddy
NODE_ENV=development npm i
jspm i
```

### run example
```
npm run bundle
npm run serve
```

### LICENSE
[MIT](https://opensource.org/licenses/MIT)
