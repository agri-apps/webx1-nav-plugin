const PLUGIN = "webx1NavPlugin";

const defaultOptions = {
  activeClassName: "active",
  historyKey: `${PLUGIN}History`,
};

const install = (app, options) => {
  let opts = Object.assign({}, defaultOptions, options);

  let origRouteInit = app.routeInit;
  let origUnmountRoute = app.unmountRoute;
  let origBoot = app.boot;

  let rootEl = opts.scope ? document.querySelector(opts.scope) : app.el;

  app.routeInit = async (route, state) => {
    let origRoute = app._currentRoute;
    try {
      await origRouteInit.call(app, route, state);
    } catch (err) {
      console.error(`[${PLUGIN}] Init route failed!`);
      opts.onPluginFailed ? opts.onPluginFailed(err) : null;
    }
    // This plugin requires valid routes
    if (!app.routes || Object.keys(app.routes) === 0) {
      return;
    }

    const routeMap = Object.keys(app.routes).reduce((prev, curr) => {
      let rt = app.routes[curr];
      if (rt.name) {
        prev[rt.name] = {
          root: rt.root,
          path: curr,
          activeClass: rt.activeClass || opts.activeClassName,
        };
      }
      return prev;
    }, {});

    let links = [].slice.call(rootEl.querySelectorAll("a[data-route]"));
    links.forEach((anchor) => {
      let routeName = anchor.dataset["route"];
      let current = routeMap[routeName];
      if (!current) {
        return;
      }
      // Already bound
      if (anchor.dataset["isBound"]) {
        return;
      }

      anchor.dataset["activeClass"] =
        current.activeClass || opts.activeClassName;

      anchor.addEventListener("click", (e) => {
        // In case the data attribute was removed?
        let routeName = e.target.dataset["route"];
        if (!routeName) {
          return;
        }

        e.preventDefault();
        let { path, activeClass, root } = routeMap[routeName];
        if (path) {
          // Push history and navigate to route
          let href = e.target.href;
          let currPath = href.replace(window.location.origin, "");
          window.history.pushState({}, currPath, href);
          app.navigate(e.target.pathname);

          // Add history
          let history = app.getState(opts.historyKey) || [];
          history.push({
            path: e.target.pathname,
            route: routeName,
            fromRoute: app.routes[origRoute] ? app.routes[origRoute].name : origRoute,
            timestamp: Date.now(),
          });
          app.setState(opts.historyKey, history);
          if (opts.session) {
              sessionStorage.setItem(opts.historyKey, JSON.stringify(history));
          }

          // Highlight
          let anchorEl = root
            ? rootEl.querySelector(`[data-route="${root}"]`)
            : e.target;
          if (anchorEl) {
            let cls = activeClass || opts.activeClassName;

            anchorEl.dataset["activeClass"] = cls;
            anchorEl.classList.add(cls);
          }
        }
      });

      if (opts.onPrefetch && typeof opts.onPrefetch === 'function') {
        anchor.addEventListener("mouseenter", (e) => {
            let routeName = e.target.dataset["route"];
            if (!routeName) {
                return;
            }
            let { path } = routeMap[routeName];
            opts.onPrefetch(app.routes[path], routeName, path);
        });
      }

      anchor.dataset["isBound"] = true;
    });
  };

  app.unmountRoute = (route, state) => {
    try {
      origUnmountRoute.call(app, route, state);
    } catch (err) {
      console.error(`[${PLUGIN}] Unmount route failed!`, err);
      opts.onPluginFailed ? opts.onPluginFailed(err) : null;
    }

    [].slice.call(rootEl.querySelectorAll("a[data-route]")).forEach((link) => {
      let cls = link.dataset["activeClass"] || opts.activeClassName;
      link.classList.remove(cls);
    });
  };

  app.boot = async () => {
    await origBoot.call(app);

    let currentRoute = app.routes[app._currentRoute];

    let history = [
        {
          path: window.location.pathname,
          route: currentRoute ? currentRoute.name : null,
          fromRoute: null,
          timestamp: Date.now(),
        },
      ]

    if (opts.session) {
        let sessionHistory = sessionStorage.getItem(opts.historyKey);
        if (sessionHistory) {
            history = [...JSON.parse(sessionHistory), ...history];
        }
    }

    app.setState(opts.historyKey, history);

    if (currentRoute) {
      let routeName = currentRoute.root ? currentRoute.root : currentRoute.name;
      let anchor = rootEl.querySelector(`[data-route="${routeName}"]`);
      let cls = currentRoute.activeClass || opts.activeClassName;
      if (anchor) {
        anchor.classList.add(cls);
        anchor.dataset["activeClass"] = cls;
      }
    }
  };

  // Installed callback
  if (opts.installed && typeof opts.installed === 'function') {
      opts.installed()
  }
};

export default {
  name: PLUGIN,
  install,
};
