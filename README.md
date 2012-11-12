#liveload

A middle ware of connect/express which tells the browser to reload page/css when there's server side change without having any change in the client file.

##Installation

via npm:
  
    $ npm install -g liveload
  
##Use as static server

Goto the directory you want to serve, and type:
  
    $ liveload
  
Open your browser and then edit the html/js/css file as you like, then you can see the magic.

##Use as connect middleware

```js
var connect = require('connect')
    , http = require('http')
    , io = require('socket.io')
    , liveload = require('../');
var app = connect()
var server = http.createServer(app);
    io = io.listen(server);
app.use(liveload({io:io, root:root, socket:true}));
```

##options
  * `io` socket.io instance
  * `root` root directory for watching files
  * `socket` whether to include socket.io client JS file automatically for html content
  * `ext` additional extensions(other than js, html, css) for file watching
