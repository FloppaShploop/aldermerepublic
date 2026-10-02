// Bridge script injected into every game frame (pasted-HTML games via srcDoc,
// and link-imported games via the embed relay server route). Provides safe
// storage/fullscreen/gamepad shims plus the ArcadeSave/ArcadeLoad progress API.
//
// Progress envelope (v1), mirrored to the signed-in player's cloud row:
//   { __arcadeVersion: 1, progress, localStorage, sessionStorage, idb }
// `idb` holds a dump of the game's IndexedDB databases (Unity, Defold,
// emulators and localforage-based games save there, not in localStorage).
export const ARCADE_BRIDGE = `<script>
(function(){
  var realParent = window.parent;
  var stores = {};
  var manualProgress = {};
  var lastIdb = null;
  var saveTimer = null;
  var restoringIdb = false;
  var IDB_MAX_CHARS = 6000000;

  // ---------- bootstrap (synchronous, before the cartridge runs) ----------
  var bootstrap = null;
  try {
    var prefix = '__arcade_progress__:';
    if (typeof window.name === 'string' && window.name.indexOf(prefix) === 0) {
      bootstrap = JSON.parse(decodeURIComponent(window.name.slice(prefix.length)));
      window.name = '';
    }
  } catch (e) { bootstrap = null; }
  var meta = (bootstrap && bootstrap.meta) || {};
  var hadBootstrap = !!(bootstrap && bootstrap.__arcadeVersion === 1);

  function snapshot(store){
    var out = {};
    if (!store) return out;
    for (var i = 0; i < store.length; i++) {
      var key = store.key(i);
      if (key != null) out[key] = store.getItem(key);
    }
    return out;
  }

  // ---------- IndexedDB value encoding ----------
  function b64(bytes){
    var s = '', CH = 0x8000;
    for (var i = 0; i < bytes.length; i += CH) s += String.fromCharCode.apply(null, bytes.subarray(i, i + CH));
    return btoa(s);
  }
  function unb64(str){
    var bin = atob(str), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function enc(v){
    if (v === null || typeof v !== 'object') return v;
    if (v instanceof Date) return { __t: 'date', d: v.getTime() };
    if (v instanceof ArrayBuffer) return { __t: 'ab', d: b64(new Uint8Array(v)) };
    if (ArrayBuffer.isView(v)) {
      return { __t: 'ta', c: v.constructor && v.constructor.name, d: b64(new Uint8Array(v.buffer, v.byteOffset, v.byteLength)) };
    }
    if (typeof Blob !== 'undefined' && v instanceof Blob) return null;
    if (Array.isArray(v)) return v.map(enc);
    var o = {};
    Object.keys(v).forEach(function(k){ o[k] = enc(v[k]); });
    return o;
  }
  function dec(v){
    if (v === null || typeof v !== 'object') return v;
    if (Array.isArray(v)) return v.map(dec);
    if (v.__t === 'date') return new Date(v.d);
    if (v.__t === 'ab') return unb64(v.d).buffer;
    if (v.__t === 'ta') {
      var bytes = unb64(v.d);
      var C = window[v.c];
      if (typeof C === 'function' && C !== Uint8Array && C.BYTES_PER_ELEMENT) {
        try { return new C(bytes.buffer, 0, bytes.byteLength / C.BYTES_PER_ELEMENT); } catch (e) {}
      }
      return bytes;
    }
    var o = {};
    Object.keys(v).forEach(function(k){ o[k] = dec(v[k]); });
    return o;
  }

  // ---------- per-player IndexedDB isolation + cloud sync ----------
  var idbFactory = null;
  try { idbFactory = window.indexedDB || null; } catch (e) { idbFactory = null; }
  var idbPrefix = 'arcade::' + (meta.g || 'game') + '::' + (meta.u || 'anon') + '::';
  var origOpen = null, origDelete = null, origDatabases = null;
  function req(r){
    return new Promise(function(res, rej){
      r.onsuccess = function(){ res(r.result); };
      r.onerror = function(){ rej(r.error); };
    });
  }
  function skipName(name){ return /cache/i.test(name); }

  function dumpDb(realName){
    return new Promise(function(resolve){
      var r;
      try { r = origOpen.call(idbFactory, realName); } catch (e) { return resolve(null); }
      r.onerror = function(){ resolve(null); };
      r.onupgradeneeded = function(){ try { r.transaction.abort(); } catch (e) {} };
      r.onsuccess = function(){
        var db = r.result;
        var names = Array.prototype.slice.call(db.objectStoreNames);
        var out = { version: db.version, stores: {} };
        if (!names.length) { db.close(); return resolve(out); }
        var tx;
        try { tx = db.transaction(names, 'readonly'); } catch (e) { db.close(); return resolve(null); }
        names.forEach(function(sn){
          var st = tx.objectStore(sn);
          var info = { keyPath: st.keyPath, autoIncrement: st.autoIncrement, indexes: [], keys: [], values: [] };
          Array.prototype.slice.call(st.indexNames).forEach(function(ixn){
            var ix = st.index(ixn);
            info.indexes.push({ name: ixn, keyPath: ix.keyPath, unique: ix.unique, multiEntry: ix.multiEntry });
          });
          out.stores[sn] = info;
          var kr = st.getAllKeys(), vr = st.getAll();
          kr.onsuccess = function(){ info.keys = kr.result.map(enc); };
          vr.onsuccess = function(){ info.values = vr.result.map(enc); };
        });
        tx.oncomplete = function(){ db.close(); resolve(out); };
        tx.onerror = tx.onabort = function(){ db.close(); resolve(null); };
      };
    });
  }

  function dumpIdb(){
    if (!idbFactory || !origDatabases) return Promise.resolve(lastIdb);
    return origDatabases.call(idbFactory).then(function(list){
      var mine = (list || []).filter(function(d){
        return d.name && d.name.indexOf(idbPrefix) === 0 && !skipName(d.name);
      });
      return Promise.all(mine.map(function(d){
        return dumpDb(d.name).then(function(dump){ return [d.name.slice(idbPrefix.length), dump]; });
      }));
    }).then(function(pairs){
      var out = {};
      pairs.forEach(function(p){
        if (!p[1]) return;
        try { if (JSON.stringify(p[1]).length > IDB_MAX_CHARS) return; } catch (e) { return; }
        out[p[0]] = p[1];
      });
      lastIdb = out;
      return out;
    }).catch(function(){ return lastIdb; });
  }

  function restoreDb(shortName, dump){
    var realName = idbPrefix + shortName;
    return new Promise(function(resolve){
      var del;
      try { del = origDelete.call(idbFactory, realName); } catch (e) { return resolve(); }
      del.onblocked = function(){};
      del.onerror = function(){ resolve(); };
      del.onsuccess = function(){
        var r;
        try { r = origOpen.call(idbFactory, realName, dump.version || 1); } catch (e) { return resolve(); }
        r.onupgradeneeded = function(){
          var db = r.result;
          Object.keys(dump.stores || {}).forEach(function(sn){
            var s = dump.stores[sn];
            var opts = { autoIncrement: !!s.autoIncrement };
            if (s.keyPath != null) opts.keyPath = s.keyPath;
            var st = db.createObjectStore(sn, opts);
            (s.indexes || []).forEach(function(ix){
              try { st.createIndex(ix.name, ix.keyPath, { unique: !!ix.unique, multiEntry: !!ix.multiEntry }); } catch (e) {}
            });
          });
        };
        r.onerror = function(){ resolve(); };
        r.onsuccess = function(){
          var db = r.result;
          var names = Object.keys(dump.stores || {});
          if (!names.length) { db.close(); return resolve(); }
          var tx;
          try { tx = db.transaction(names, 'readwrite'); } catch (e) { db.close(); return resolve(); }
          names.forEach(function(sn){
            var s = dump.stores[sn], st = tx.objectStore(sn);
            (s.values || []).forEach(function(val, i){
              try {
                if (s.keyPath != null) st.put(dec(val));
                else st.put(dec(val), dec(s.keys[i]));
              } catch (e) {}
            });
          });
          tx.oncomplete = tx.onerror = tx.onabort = function(){ db.close(); resolve(); };
        };
      };
    });
  }

  var idbReady = Promise.resolve();
  if (idbFactory) {
    try {
      origOpen = idbFactory.open;
      origDelete = idbFactory.deleteDatabase;
      origDatabases = idbFactory.databases;
      var saved = hadBootstrap && bootstrap.idb && typeof bootstrap.idb === 'object' ? bootstrap.idb : null;
      if (saved && Object.keys(saved).length) {
        lastIdb = saved;
        restoringIdb = true;
        idbReady = Promise.all(Object.keys(saved).map(function(n){ return restoreDb(n, saved[n]); }))
          .catch(function(){})
          .then(function(){ restoringIdb = false; });
      }
      // Games open their databases through this wrapper: names are scoped to
      // the signed-in player, and opens wait until the cloud copy is restored.
      idbFactory.open = function(name, version){
        var args = [idbPrefix + String(name)];
        if (version !== undefined) args.push(version);
        if (!restoringIdb) return origOpen.apply(idbFactory, args);
        var real = null, listeners = {};
        var fake = {
          onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null,
          source: null,
          addEventListener: function(t, f){ (listeners[t] = listeners[t] || []).push(f); },
          removeEventListener: function(t, f){ listeners[t] = (listeners[t] || []).filter(function(x){ return x !== f; }); },
          dispatchEvent: function(){ return true; }
        };
        Object.defineProperty(fake, 'result', { get: function(){ try { return real ? real.result : undefined; } catch (e) { return undefined; } } });
        Object.defineProperty(fake, 'error', { get: function(){ try { return real ? real.error : null; } catch (e) { return null; } } });
        Object.defineProperty(fake, 'readyState', { get: function(){ return real ? real.readyState : 'pending'; } });
        Object.defineProperty(fake, 'transaction', { get: function(){ return real ? real.transaction : null; } });
        idbReady.then(function(){
          real = origOpen.apply(idbFactory, args);
          ['success','error','upgradeneeded','blocked'].forEach(function(t){
            real.addEventListener(t, function(ev){
              var h = fake['on' + t];
              if (typeof h === 'function') h.call(fake, ev);
              (listeners[t] || []).forEach(function(f){ f.call(fake, ev); });
            });
          });
        });
        return fake;
      };
      idbFactory.deleteDatabase = function(name){
        return origDelete.call(idbFactory, idbPrefix + String(name));
      };
      if (origDatabases) {
        idbFactory.databases = function(){
          return origDatabases.call(idbFactory).then(function(list){
            return (list || []).filter(function(d){ return d.name && d.name.indexOf(idbPrefix) === 0; })
              .map(function(d){ return { name: d.name.slice(idbPrefix.length), version: d.version }; });
          });
        };
      }
      // Any write to a game database schedules a cloud save.
      ['put','add','delete','clear'].forEach(function(fn){
        var orig = IDBObjectStore.prototype[fn];
        if (!orig) return;
        IDBObjectStore.prototype[fn] = function(){
          var out = orig.apply(this, arguments);
          if (!restoringIdb) scheduleSave(900);
          return out;
        };
      });
    } catch (e) {}
  }

  // ---------- saving ----------
  var saving = false, saveAgain = false;
  function saveEnvelope(){
    if (saving) { saveAgain = true; return; }
    saving = true;
    dumpIdb().then(function(idb){
      try {
        realParent.postMessage({
          __arcade: 'save',
          data: {
            __arcadeVersion: 1,
            progress: manualProgress,
            localStorage: snapshot(stores.localStorage),
            sessionStorage: snapshot(stores.sessionStorage),
            idb: idb || {}
          }
        }, '*');
      } catch (e) {}
    }).then(function(){
      saving = false;
      if (saveAgain) { saveAgain = false; saveEnvelope(); }
    });
  }
  function scheduleSave(delay){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveEnvelope, delay || 150);
  }
  document.addEventListener('visibilitychange', function(){ if (document.hidden) saveEnvelope(); });
  window.addEventListener('pagehide', function(){ saveEnvelope(); });

  // ---------- localStorage / sessionStorage shims ----------
  function shim(name){
    var m = {};
    var api = {
      getItem: function(k){ k = String(k); return Object.prototype.hasOwnProperty.call(m, k) ? m[k] : null; },
      setItem: function(k, v){ m[String(k)] = String(v); scheduleSave(); },
      removeItem: function(k){ delete m[String(k)]; scheduleSave(); },
      clear: function(){ m = {}; scheduleSave(); },
      key: function(i){ var ks = Object.keys(m); return ks[i] != null ? ks[i] : null; },
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

  function applySaved(saved){
    if (saved && saved.__arcadeVersion === 1) {
      manualProgress = saved.progress || {};
      if (stores.localStorage && stores.localStorage.__hydrate) stores.localStorage.__hydrate(saved.localStorage);
      else if (stores.localStorage && saved.localStorage) Object.keys(saved.localStorage).forEach(function(k){ try { stores.localStorage.setItem(k, saved.localStorage[k]); } catch (e) {} });
      if (stores.sessionStorage && stores.sessionStorage.__hydrate) stores.sessionStorage.__hydrate(saved.sessionStorage);
    } else if (saved) {
      manualProgress = saved;
    }
  }
  applySaved(bootstrap);

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
  // (e.g. window.parent.maeExportApis_()). Wrap parent so unknown host helpers
  // become harmless no-ops instead of crashing the first script.
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
  var resolved = hadBootstrap || bootstrap ? manualProgress : null;
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
      // The bootstrap copy already restored everything before the game ran;
      // re-applying it now would wipe writes the game made since startup.
      if (!hadBootstrap) applySaved(e.data.data || {});
      resolved = manualProgress;
      pending.splice(0).forEach(function(r){ r(resolved); });
    }
  });
  // Cross-origin scripts report a censored "Script error." with no detail.
  function useless(msg){
    return !msg || /^\\s*script error\\.?\\s*$/i.test(msg) || msg === 'undefined' || msg === 'null';
  }
  window.addEventListener('error', function(e){
    var msg = e && e.message;
    if (useless(msg)) return;
    if (e && e.filename) msg += ' (' + e.filename + ':' + (e.lineno || 0) + ')';
    realParent.postMessage({__arcade:'error', message: msg}, '*');
  });
  window.addEventListener('unhandledrejection', function(e){
    var r = e && e.reason;
    var msg = (r && r.message) || String(r);
    if (useless(msg)) return;
    realParent.postMessage({__arcade:'error', message: msg}, '*');
  });
  // Periodic safety save so progress survives leaving the page abruptly.
  setInterval(function(){ if (!document.hidden) saveEnvelope(); }, 20000);
  realParent.postMessage({__arcade:'ready'}, '*');
})();
</scr` + `ipt>
<style>html,body{margin:0;height:100%;background:#000;color:#fff;overflow:hidden}canvas{max-width:100%}</style>`;
