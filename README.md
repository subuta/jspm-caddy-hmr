## jspm-caddy-hmr
using this module, you will get.
- HMR with jspm bundle support(added from jspm v1.7~)
- Easy to start (No need to launch another file watcher process)
- Easy to use (simple structure)

CAUTION! jspm-caddy-hmr is only tested with jspm@0.17.0-beta.22, other version of jspm may not work ...
CAUTION! this repository is not actively maintained. I'm waiting for major release of jspm ... 

[README - 日本語版](README-ja.md)

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

#call jspm link from another project may be useful for debugging purpose.
jspm link ~/repo_personal/jspm-caddy-hmr

#to unlink(install from remote npm registry) call this command
jspm install --unlink npm:jspm-caddy-hmr
```

### run example
```
npm run bundle
npm run serve
```

### LICENSE
[MIT](https://opensource.org/licenses/MIT)
