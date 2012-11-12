/**
 * Use at client side for reload page or page resources when there is any change at server side
 * Author: Jack Zhao <qzhao@tibco-support.com>
 */
(function(){
  /**
   * reload css file according to given filename
   */
  function reloadCss(file){
    var param = '_timestamp',
    ts = new Date().getTime(),
    links = document.getElementsByTagName('link'),
    reg = new RegExp(file.replace(/\//g,'\\/'));
    for(i = 0; i < links.length; i++){
      var link = links[i];
      var href = link.href;
      if(reg.test(href)){
        var re = new RegExp(param + "=([^&]+)","g");
        var newHref = href.replace(re, param + "=" + ts);
        if (newHref.indexOf(param) == - 1) {
            var appnd = "&";
            if (newHref.indexOf("?") == - 1) {
                appnd = '?';
            }
            newHref += appnd + param + "=" + ts;
        }
        link.href = newHref;
        return false;
      }
    }
  }

  var socket = io.connect();
  //reload resources when file change
  socket.on('filechange',function(data){
    var file = data.file;
    if(/\.css$/.test(file)){
      reloadCss(file);
    }else{
      location.reload();
    }
  });
})();
