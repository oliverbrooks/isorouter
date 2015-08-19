var url          = require("url");
var pathToRegexp = require('path-to-regexp');
var browserEnv   = require("./lib/browser-inject");
var historyEnv   = require("./lib/history");


function handler(method, path, fn, next) {
  var re = pathToRegexp(path, keys);
  var keys = re.keys;

  this.routes.push(function(_path, _method, req, res) {
    if(method !== "use" && method !== _method) {
      return false;
    }

    var results = re.exec(_path);
    if(!results) {
      return false;
    }

    var params = {};
    keys.forEach(function(key, idx) {
      params[key.name] = results[idx+1];
    });

    req.params = params;

    var urlParsed = url.parse(_path, true);

    req.path  = urlParsed.path;
    req.query = urlParsed.query;

    fn(req, res);

    if(method === "use") {
      return false;
    } else {
      return true;
    }
  });
}

function go(path, method, silent) {
  method = method || "get";

  var ret = true;
  var req = {};
  var res = {};

  if(!silent) {
    historyEnv.go(path);
  }

  if(!ret) {
    return false;
  }
  this.routes.some(function(fn) {
    return fn(path, method, req, res);
  });
  return true;
}




module.exports = function(opts) {
  opts = opts || {};
 
  var env, router;

  var ctx = {
    routes: []
  };

  function destroy() {
    if(env) {
      env.destroy();
    }
  }

  window.addEventListener("popstate", function(e) {
    var url = document.location.pathname + document.location.search;
    go.call(ctx, url, "get", true);
  });

  router = {
    get: handler.bind(ctx, "get"),
    post: handler.bind(ctx, "post"),
    put: handler.bind(ctx, "put"),
    delete: handler.bind(ctx, "delete"),
    use: handler.bind(ctx, "use"),
    go: go.bind(ctx),
    destroy: destroy,
    history: historyEnv
  };

  if(opts.inject) {
    env = browserEnv.call(router, opts.inject);
  }

  return router;
};

