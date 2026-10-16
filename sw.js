/* 次だれ？ オフライン用。開くときは保存済みの版をすぐ出し、裏で最新版を取りに行く。 */
var CACHE='tsugidare-cache-v1';
var FILES=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){
    return Promise.all(FILES.map(function(u){return c.add(new Request(u,{cache:'reload'})).catch(function(){})}));
  }).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
function notify(){self.clients.matchAll().then(function(cs){cs.forEach(function(c){c.postMessage('updated')})})}
self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET')return;
  var u=new URL(r.url);
  if(u.origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(function(c){
    return c.match(r,{ignoreSearch:true}).then(function(hit){
      var old=hit?hit.clone():null;
      var net=fetch(r.url,{cache:'no-cache'}).then(function(res){
        if(!(res&&res.ok))return res;
        var cp=res.clone();
        var chk=old?Promise.all([old.text(),res.clone().text()]).then(function(t){return t[0]!==t[1]}).catch(function(){return false}):Promise.resolve(false);
        return chk.then(function(diff){return c.put(r,cp).then(function(){if(diff&&r.mode==='navigate')notify();return res})});
      }).catch(function(){return hit});
      e.waitUntil(net.catch(function(){}));
      return hit||net;
    });
  }));
});
