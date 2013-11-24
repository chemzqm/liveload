/*jshint regexp:true */
/**
 * Auto reload the page or css file when there's any change at server side of watching files,
 * script is injected in html content automatically.
 *
 * Usage:
 * ```js
 * var liveload = require('liveload');
 * var app = connect()
 *  .use(liveload({root:'./public',files:/\.(html|css|js)$/, excludes:/^(node_modules|\.git)$/, delay:100}));
 * ```
 */
var fs = require('fs')
  , path = require('path')
  , tinylr = require('tiny-lr')
  , growl = require('growl')
  , watchDir = require('./watch');

function isHtml(req) {
    var accept = req.headers['accept'] || '';
    return /^text\/html/.test(accept);
}

/**
 * Watch for file change and fire 'filechange' event with socket.io
 * 
 * @param {Server} tiny-lr server instance
 * @param {String|Array} root path for file watching
 * @param {Regex} [optional] files regexp for watching files
 * @param {Regex} [optional] excludes regex used for exclude folders
 * @api private
 */
function watch(server, root, files ,excludes){
  if(!root){
    throw new Error('root is required for file watching');
  }
  if(Array.isArray(root)){
    root.forEach(function(v){
      watch(server, v, files, excludes);
    });
    return;
  }
  watchDir(root, {excludes: excludes} ,function(file){
    var basename = path.basename(file);
    if(files && files.test(basename)){
      //console.log('Changed file: \033[00;34m: ' + file + '\033[00m');
      growl('Change file: ' + basename + '. Reloading...', { image: 'Safari', title: 'liveload' })
      //emit filechange event
      server.changed({
        body: {
          files: file
        }
      });
    }
  });
}
function getSnippet (port) {
  /*jshint quotmark:false */
  var snippet = [
      "<!-- livereload snippet -->",
      "<script>document.write('<script src=\"http://'",
      " + (location.host || 'localhost').split(':')[0]",
      " + ':" + port + "/livereload.js?snipver=1\"><\\/script>')",
      "</script>",
      ""
      ].join('\n');
  return snippet;
}
/**
 * @param {Object} opt
 *    {String} `root` root folder for file watching #required
 *    {RegExp} `files` for watching eg: /\.(html|css|js)/
 *    {RegExp} `excludes` regexp for exclude folders
 *    {Boolean} `inject` whether to include the snippet script on the fly, default true
 *    {Number} `buffer` miliseconds to buffer the reload trigger, default 50
 *    {Number} `port` the port for tiny-lr server to listen to, default 35729
 */
module.exports = function(opt) {
  var inject = (opt.inject === undefined)? true : opt.inject;
  var port = opt.port || 35729;
  //setup the server
  var server = new tinylr()
  server.listen( port, function(err) {
    if(err){
      throw err;
    }
    console.log('... Starting Livereload server on ' + port);
  })
  //watch file change
  watch(server, opt.root, opt.files, opt.excludes);
  /**
   * All the response that is 'text/html' content will be add the script automatically
   */
  return function(req, res, next) {
      var write = res.write,
          writeHead = res.writeHead,
          end = res.end,
          called,
          buf = '';
      if(!inject || !isHtml(req)){ return next(); }

      // Bypass write until end
      var inject_snippet = function(string, encoding) {
        if (called) return;
        if (string !== undefined) {
          var body = string instanceof Buffer ? string.toString(encoding) : string;
          buf += body.replace(/<\/body>/, function (w) {
              called = true;
              return getSnippet(port) + w;
          });
        }
      }

      res.write = function (string, encoding) {
        write.call(res, '', encoding);
        inject_snippet(string, encoding);
        return true;
      };

      res.writeHead = function() {
      }

      res.end = function (string, encoding) {
        res.end = end;
        res.write = write;
        // Restore writeHead
        res.writeHead = writeHead;
        inject_snippet(string, encoding);

        if (buf &&!res._header) {
          res.setHeader('content-length', Buffer.byteLength(buf, encoding));
        }
        end.call(res, buf, encoding);
      }
      next();
  };
};

