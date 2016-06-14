## jspm-caddy-hmr
jspm向けのHMR実装です。(Caddyと一緒に使います。
- 高速なHMR(jspmのbundleを検知し、そちらを利用します)
- 簡単に始められる！(他のプロセスを立てる必要はありません)
- 使いやすい！(シンプルな構造です)

### 必要なもの
- Caddy
- jspm@beta(0.17)

```
brew install caddy
npm install jspm@beta -g
```

### 使い方
1 jspm-caddy-hmrをローカルの依存性としてインストールします。
```
npm install jspm-caddy-hmr --save-dev
```

2 インストールしたjspm-caddy-hmr(サーバ)をCaddyのWebsocket Directiveとして定義します。

```
localhost:3000

gzip
browse
ext .html

websocket /watch "node ./node_modules/.bin/jspm-caddy-hmr"
```

3 jspm-caddy-client(クライアント)をブラウザ側で読み込みます。(index.htmlかJS内で)

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

もし何かしらの理由で、File Watcherを別プロセスにしたい場合
(`Caddy使ってない場合とか`)は、`websocketd`を使うことで代用できます。
※その場合は、websocketdで指定したポートをクライアント側でも指定してください。
```
websocketd --port=8080 jspm-caddy-hmr

and specify watcher port explicitly.

new Watcher.default('/', 8080);
```

---

### 開発方法
```
npm install jspm@beta -g
brew install caddy
NODE_ENV=development npm i
jspm i

#デバッグ時はjspm linkコマンドを他のプロジェクトから呼ぶと便利です。
jspm link ~/repo_personal/jspm-caddy-hmr

#jspm linkの解除は、以下のコマンドを呼び出します。(以降remoteからdownloadされるようになる。
jspm install --unlink npm:jspm-caddy-hmr
```

### Exampleの起動
```
npm run bundle
npm run serve
```

### LICENSE
[MIT](https://opensource.org/licenses/MIT)
