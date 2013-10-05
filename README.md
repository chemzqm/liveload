#liveload

A server which detect the file change and reload the resource at client side automatically, 
could be also used as a connect middleware for file watching and livereload server with snippet
contains script tag injected on the fly.

[About the snippet of script tag](http://feedback.livereload.com/knowledgebase/articles/86180-how-do-i-add-the-script-tag-manually-)


##Installation

via npm:
  
    $ npm install -g liveload
  

##File change notification

Need to install some sofeware to support the notification, refer to <https://github.com/visionmedia/node-growl>

##Use as static server

Goto the directory you want to serve, and type:
  
    $ liveload
  
And enjoy live edit of css/js/html files.

##Use as connect middleware

```js
var connect = require('connect')
    , http = require('http')
    , liveload = require('liveload');
var app = connect();
var root = process.cwd();

app.use(liveload({root:root, files:/.(js|css|html)$/,excludes:/^node_modules$/}))
  .use(connect['static'](root))
  .use(connect.directory(root));

http.createServer(app).listen(3000);
```

**options**

  * `root` root directory for watching files, could be array of directory path, this is **required**
  * `files` regexp for watching files eg: `/\.(html|css|js)$/`
  * `exclude` excludes regex used for exclude folders
  * `inject` boolean value indicate whether to inject the script element on the fly, default `true`
  * `port` port number for the livereload server, default `35927`

##Reset maxinum number for file watch
  
  Nodejs would report an error if there's too many files for watching due to system limitation, on Linux you can change that by adding `fs.inotify.max_user_watches = 524288` to the file `etc/sysctl.conf` and restart the process by command:

```bash
sudo sysctl -p
```
