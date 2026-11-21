/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-afac4cd2'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "pwa-maskable-512x512.png",
    "revision": "e54a16bc5e5691d5293f4d4f234acd7d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "5df44fbe4cb97621c346c071dc404446"
  }, {
    "url": "pwa-192x192.png",
    "revision": "9b337b98dd8b2df0cb7229841974da5d"
  }, {
    "url": "index.html",
    "revision": "ffec9561d2176739814e63932f9129f6"
  }, {
    "url": "icon.svg",
    "revision": "c5fcc25e9e7b8981250e181569cbc2e4"
  }, {
    "url": "icon-maskable.svg",
    "revision": "efafc5f304d5a4ec450a49f41f096d1e"
  }, {
    "url": "favicon.png",
    "revision": "5dbf7950681b811290792616bd8ef259"
  }, {
    "url": "favicon.ico",
    "revision": "b981f7cba59b0b67574581d74fe96af9"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f4cd160a407a4a4ec9f424192d2e7ddd"
  }, {
    "url": "404.html",
    "revision": "dc4871336b81655774ba533b84439f2d"
  }, {
    "url": "100042597.svg",
    "revision": "c5fcc25e9e7b8981250e181569cbc2e4"
  }, {
    "url": "1000042597.svg",
    "revision": "c5fcc25e9e7b8981250e181569cbc2e4"
  }, {
    "url": "fonts/alexandria/Alexandria-SemiBold.woff2",
    "revision": "6930055d9f94275ac2737433e3e3475f"
  }, {
    "url": "fonts/alexandria/Alexandria-Regular.woff2",
    "revision": "0ec4e3bf128425215ce11aee132a2663"
  }, {
    "url": "fonts/alexandria/Alexandria-Medium.woff2",
    "revision": "332e40ec688b4491e4a3a1289ba04f47"
  }, {
    "url": "fonts/alexandria/Alexandria-ExtraBold.woff2",
    "revision": "111484fa11a26911cfe49ec58f79e2b6"
  }, {
    "url": "fonts/alexandria/Alexandria-Bold.woff2",
    "revision": "53387b90458625bcd8dbe239890131c8"
  }, {
    "url": "fonts/alexandria/Alexandria-Black.woff2",
    "revision": "c3df9f950e5fef70a97f7b7b9b243d7b"
  }, {
    "url": "assets/workbox-window.prod.es5-BBnX5xw4.js",
    "revision": null
  }, {
    "url": "assets/index-DqDQjQpl.js",
    "revision": null
  }, {
    "url": "assets/index-CyE8wRM4.css",
    "revision": null
  }, {
    "url": "assets/aistudio/____________611_20261107133555_865d2b5e.png",
    "revision": null
  }, {
    "url": "1000042597.svg",
    "revision": "c5fcc25e9e7b8981250e181569cbc2e4"
  }, {
    "url": "100042597.svg",
    "revision": "c5fcc25e9e7b8981250e181569cbc2e4"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "f4cd160a407a4a4ec9f424192d2e7ddd"
  }, {
    "url": "favicon.png",
    "revision": "5dbf7950681b811290792616bd8ef259"
  }, {
    "url": "icon.svg",
    "revision": "c5fcc25e9e7b8981250e181569cbc2e4"
  }, {
    "url": "pwa-192x192.png",
    "revision": "9b337b98dd8b2df0cb7229841974da5d"
  }, {
    "url": "pwa-512x512.png",
    "revision": "5df44fbe4cb97621c346c071dc404446"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "e54a16bc5e5691d5293f4d4f234acd7d"
  }, {
    "url": "manifest.webmanifest",
    "revision": "af8c44143a89bd15272dd60261206147"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
