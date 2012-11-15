/*jshint regexp:true */
/**
 * Auto reload the page or css file when there's any change at server side of watching files,
 * script is injected in html content automatically.
 *
 * Usage:
 * ```js
 * var liveload = require('lib/liveload.js');
 * var app = connect()
 *  .use(liveload({io:io,root:'./public',socket:true}));
 * ```
 */
var fs = require('fs')
  , path = require('path')
  , uglify = require('uglify-js')
  , util = require('./util');

function filter(req, res) {
    var type = res.getHeader('Content-Type') || '';    
    return !! type.match(/text\/html/);
}

/**
 * Watch for file change and fire 'filechange' event with socket.io
 * @param {socket.io} socket.io instance
 * @param {String} root path for file watching
 * @param {Array} more extensions
 * @api private
 */
function watch(io, root, ext){
  if(!root) throw new Error('root is required for file watching');
  var regstr = 'js|html|css';
  //ext is additional file extensions for watching
  if(ext && ext.length){
    regstr += '|' + ext.join('|');
  }
  var reg = new RegExp('\\.(' +regstr + ')$');
  console.log(reg);
  util.watchFile(root, function(file){//watch the files
    file = path.basename(file);
    if(reg.test(file)){//only watch the files we want to
      return true;
    }else if(/^(\.git|\.svn|node_modules)$/.test(file)){//never watch node modules svn git
      return false;
    }
  },function(err, file){
    //emit filechange event
     io.sockets.emit('filechange', {
        file:path.basename(file)
      });
  });
}
/**
 * @param {Object} opt 
 *    {socket.io} io socket.io instance #required
 *    {String} root root folder for file watching #required
 *    {Array} ext additional file extensions for watching
 *    {Boolean} socket whether to include script '/socket.io.js' in html content #default:false 
 *
 */
module.exports = function(opt) {
  var socket = opt.socket;
  var js = fs.readFileSync(path.resolve(__dirname, 'reload.js'), 'utf8');
  var temp = '<script type="text/javascript" defer>' + uglify(js) + '</script>';
  if(socket === true){
    temp = '\n<script type="text/javascript" defer src="/socket.io/socket.io.js"></script>\n' + temp
  }
  function replace(chunk, encoding) {
    var str = chunk.toString(encoding);
    str = str.replace(/<\/body\>/, temp + '</body>');
    return new Buffer(str, encoding);
  }
  //watch file change
  watch(opt.io, opt.root, opt.ext);
  /**
   * All the response that is 'text/html' content will be add the script automatically
   */
  return function(req, res, next) {
      var write = res.write,
          end = res.end,
          called = false,
          ishtml;
      
      res.write = function(chunk, encoding) {
          if (!this.headerSent) this._implicitHeader();//send the header
          if (ishtml && called === false){
              chunk = replace(chunk, encoding);
              called = true;
          }
          return write.call(res, chunk, encoding);
      };

      res.end = function(chunk, encoding) {
          if (!this.headerSent) this._implicitHeader();//send the header
          if (ishtml && chunk && called === false) {
              chunk = replace(chunk, encoding);
              called = true;
          }
          return end.call(res, chunk, encoding);
      };
      res.on('header', function() {
          ishtml = filter(req, res);
          if (!ishtml) return;
          res.removeHeader('Content-Length');
      });
      next();
  };
};
