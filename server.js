var connect = require('connect')
    , http = require('http')
    , path = require('path')
    , io = require('socket.io')
    , httpProxy = require('http-proxy')
    , liveload = require('./lib/liveload')
    , fs = require('fs');

var proxy = new httpProxy.RoutingProxy();
var root = __dirname;

var app = connect()
var server = http.createServer(app);
    io = io.listen(server);
app.use(connect.cookieParser())
  .use(connect.session({secret:"SSSeee!"}))
  .use(liveload({io:io, root:root,socket:true}))
  //serve static files
  .use(connect['static'](root))
  .use(function(req, res, next){
    //revert proxy
    if(/\/schneider\//.test(req.url)){
      proxy.proxyRequest(req, res, {
        host:'ec2-54-241-119-97.us-west-1.compute.amazonaws.com',
        port:80
      });
    }else{
      next();
    }
  });

server.listen(3000);


io.sockets.on('connection', function (socket){
  console.log('client connected');
  socket.on('disconnect',function(){
    console.log('client disconnected');
  });
});

console.log('server listening at 3000');
