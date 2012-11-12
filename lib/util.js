var fs = require('fs'),
  path = require('path');

//async walk 
function walk(dir, filter, callback){
  fs.readdir(dir, function(err, list){
    if(err) return callback(err);
    list.forEach(function(file){
      file = path.resolve(dir, file);
      var re = filter(file);
      if(re === false){
        return;
      }else if(re === true){
        callback(null, file);
      }else{
        fs.stat(file, function(err, stat){
          if(err) return callback(err);
          if(stat && stat.isDirectory()){
            walk(file,filter, callback);
          }
        });
      }
    });
  });
}

//only the last one in ms milisecond will be called others will be ignore
function delay(fn, ms){
  var me, args, called, excute = function(){
      fn.apply(me, args);
      called = false;
    };
    ms = ms||100;
  return function(){
    me = this;
    args = arguments;
    if(!called){
      called = true;
      setTimeout(excute, ms);
    }
  };
}

exports.watchFile = function (dir, filter, fn){
  walk(dir, filter, function(err ,file){
     if(err) fn(err);
     fs.watch(file, delay(function(e, name){ 
       fn(null, file);
     }));
  });
};

exports.guid = function(){
  var id = 0;
  return function(){
       return ++ id;
    };
}();
