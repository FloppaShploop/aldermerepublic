// Bridge script injected into every game frame (pasted-HTML games via srcDoc,
// and link-imported games via the embed relay server route). Provides safe
// storage/fullscreen/gamepad shims plus the ArcadeSave/ArcadeLoad progress API.
export const ARCADE_BRIDGE = `<script>
(function(){
  // Give every cartridge its own storage and mirror it to the signed-in
  // player's cloud progress. This also keeps opaque sandbox origins from
  // throwing when a game touches localStorage.
  var stores = {};
  var manualProgress = {};
  var saveTimer = null;
  function snapshot(store){
    var out = {};
    for (var i = 0; i < store.length; i++) {
      var key = store.key(i);
      if (key != null) out[key] = store.getItem(key);
    }
    return out;
  }
  function saveEnvelope(){
    try {
      realParent.postMessage({
        __arcade: 'save',
        data: {
          __arcadeVersion: 1,
          progress: manualProgress,
          localStorage: snapshot(stores.localStorage),
          sessionStorage: snapshot(stores.sessionStorage)
        }
      }, '*');
    } catch (e) {}
  }
  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveEnvelope, 120);
  }
  function shim(name){
    var m = {};
    var api = {
      getItem: function(k){ return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function(k, v){ m[k] = String(v); scheduleSave(); },
      removeItem: function(k){ delete m[k]; scheduleSave(); },
      clear: function(){ m = {}; scheduleSave(); },
      key: function(i){ return Object.keys(m)[i] != null ? Object.keys(m)[i] : null; },
      get length(){ return Object.keys(m).length; },
      __hydrate: function(values){
        m = {};
        if (!values || typeof values !== 'object') return;
        Object.keys(values).forEach(function(k){ m[k] = String(values[k]); });
      }
    };
    stores[name] = api;
    return api;
  }
  ['localStorage','sessionStorage'].forEach(function(name){
    var storage = shim(name);
    try { Object.defineProperty(window, name, { value: storage, configurable: true }); }
    catch (e) {
      try {
        var nativeStorage = window[name];
        nativeStorage.clear();
        stores[name] = nativeStorage;
      } catch (ignored) {}
    }
  });
  // Gamepad access can be blocked by permissions policy; never let it throw.
  try {
    var origPads = navigator.getGamepads && navigator.getGamepads.bind(navigator);
    navigator.getGamepads = function(){
      try { return origPads ? origPads() : []; } catch (e) { return []; }
    };
  } catch (e) {}

  // Games that call these in a sandbox throw and stop executing.
  ['requestFullscreen','webkitRequestFullscreen'].forEach(function(fn){
    try {
      var proto = Element.prototype;
      var orig = proto[fn];
      if (orig) proto[fn] = function(){ try { return orig.apply(this, arguments); } catch (e) { return Promise.resolve(); } };
    } catch (e) {}
  });

  // Many ripped game files call helper functions on their original host page
  // (e.g. window.parent.maeExportApis_()). Here that function does not exist,
  // the very first script throws, and the whole game stops before it draws.
  // Wrap parent so unknown host helpers become harmless no-ops.
  var realParent = window.parent;
  var PASS_THROUGH = ['document','location','frames','window','self','top','opener','parent','length','name','closed','origin','navigator','history','localStorage','sessionStorage'];
  try {
    var proxied = new Proxy({}, {
      get: function(_t, prop){
        if (prop === 'postMessage') {
          return function(){ return realParent.postMessage.apply(realParent, arguments); };
        }
        if (typeof prop !== 'string' || PASS_THROUGH.indexOf(prop) !== -1) {
          try { return realParent[prop]; } catch (e) { return undefined; }
        }
        try {
          var v = realParent[prop];
          if (typeof v === 'function') return v.bind(realParent);
          if (v !== undefined) return v;
        } catch (e) {}
        return function(){};
      },
      set: function(){ return true; },
      has: function(){ return true; }
    });
    window.parent = proxied;
  } catch (e) {}

  var pending = [];
  var resolved = null;
  window.ArcadeSave = function(data){
    manualProgress = data == null ? {} : data;
    saveEnvelope();
  };
  window.ArcadeLoad = function(){
    if (resolved) return Promise.resolve(resolved);
    return new Promise(function(res){ pending.push(res); });
  };
  window.addEventListener('message', function(e){
    if (e.data && e.data.__arcadeHost === 'progress') {
      var saved = e.data.data || {};
      if (saved.__arcadeVersion === 1) {
        manualProgress = saved.progress || {};
        resolved = manualProgress;
        if (stores.localStorage && stores.localStorage.__hydrate) stores.localStorage.__hydrate(saved.localStorage);
        if (stores.sessionStorage && stores.sessionStorage.__hydrate) stores.sessionStorage.__hydrate(saved.sessionStorage);
      } else {
        manualProgress = saved;
        resolved = saved;
      }
      pending.splice(0).forEach(function(r){ r(resolved); });
    }
  });
  // Cross-origin scripts report a censored "Script error." with no detail.
  // Those are noise (usually a third-party asset), so never surface them.
  function useless(msg){
    return !msg || /^\\s*script error\\.?\\s*$/i.test(msg) || msg === 'undefined' || msg === 'null';
  }
  window.addEventListener('error', function(e){
    var msg = e && e.message;
    if (useless(msg)) return;
    if (e && e.filename) msg += ' (' + e.filename + ':' + (e.lineno || 0) + ')';
    parent.postMessage({__arcade:'error', message: msg}, '*');
  });
  window.addEventListener('unhandledrejection', function(e){
    var r = e && e.reason;
    var msg = (r && r.message) || String(r);
    if (useless(msg)) return;
    parent.postMessage({__arcade:'error', message: msg}, '*');
  });
  parent.postMessage({__arcade:'ready'}, '*');
})();
</scr` + `ipt>
<style>html,body{margin:0;height:100%;background:#000;color:#fff;overflow:hidden}canvas{max-width:100%}</style>`;
