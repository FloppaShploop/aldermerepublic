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
  window.addEventListener('error', function(e){
    parent.postMessage({__arcade:'error', message: (e && e.message) || 'script error'}, '*');
  });
  window.addEventListener('unhandledrejection', function(e){
    var r = e && e.reason;
    parent.postMessage({__arcade:'error', message: (r && r.message) || String(r)}, '*');
  });
  parent.postMessage({__arcade:'ready'}, '*');
})();
</scr` + `ipt>
<style>html,body{margin:0;height:100%;background:#000;color:#fff;overflow:hidden}canvas{max-width:100%}</style>`;
