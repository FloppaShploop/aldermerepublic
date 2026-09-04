// Bridge script injected into every game frame (pasted-HTML games via srcDoc,
// and link-imported games via the embed relay server route). Provides safe
// storage/fullscreen/gamepad shims plus the ArcadeSave/ArcadeLoad progress API.
export const ARCADE_BRIDGE = `<script>
(function(){
  // Sandboxed frames have an opaque origin, so touching localStorage throws and
  // kills most games on their first line. Swap in an in-memory shim up front.
  function shim(){
    var m = {};
    return {
      getItem: function(k){ return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function(k, v){ m[k] = String(v); },
      removeItem: function(k){ delete m[k]; },
      clear: function(){ m = {}; },
      key: function(i){ return Object.keys(m)[i] != null ? Object.keys(m)[i] : null; },
      get length(){ return Object.keys(m).length; }
    };
  }
  ['localStorage','sessionStorage'].forEach(function(name){
    var ok = false;
    try { window[name].setItem('__probe','1'); window[name].removeItem('__probe'); ok = true; } catch (e) {}
    if (!ok) { try { Object.defineProperty(window, name, { value: shim(), configurable: true }); } catch (e) {} }
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
  window.ArcadeSave = function(data){ parent.postMessage({__arcade:'save', data: data}, '*'); };
  window.ArcadeLoad = function(){
    if (resolved) return Promise.resolve(resolved);
    return new Promise(function(res){ pending.push(res); });
  };
  window.addEventListener('message', function(e){
    if (e.data && e.data.__arcadeHost === 'progress') {
      resolved = e.data.data || {};
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
