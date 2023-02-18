import * as esbuild from "esbuild-wasm";
import axios from "axios";
import localforage from "localforage";

// create a new object that we can use to interact with instance of an index database inside the browser.

const fileCache = localforage.createInstance({
  name: "filecache",
});

export const fetchPlugin = (inputCode: string) => {
  return {
    name: "fetch-plugin",
    setup(build: esbuild.PluginBuild) {
      //--------------------- onLoad() =  Attempts to load the file ------------------

      build.onLoad({ filter: /(^index\.js$)/ }, () => {
        return {
          loader: "jsx",
          contents: inputCode,
        };
      });

      // ----------------------------------------------------------------------------------

      build.onLoad({ filter: /.css$/ }, async (args: any) => {
        // Check to see if we already have fetched file and it is in the cache data.
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        // if it is, return it.

        if (cachedResult) {
          return cachedResult;
        }

        const { data, request } = await axios.get(args.path);

        const escapedData = data
          .replace(/\n/g, "")
          .replace(/"/g, '\\"')
          .replace(/'/g, "\\'");

        const contents = `
            const style = document.createElement('style');
            style.innerText = '${escapedData}';
            document.head.appendChild(style);`;

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: contents,
          resolveDir: new URL("./", request.responseURL).pathname,
        };

        // ------ Store response in cache -------------
        await fileCache.setItem(args.path, result);

        return result;
      });

      // ------------------------------------------------------------------

      build.onLoad({ filter: /.*/ }, async (args: any) => {
        // if (args.path === "index.js") {
        //   return {
        //     loader: "jsx",
        //     contents: inputCode,
        //     // contents: `
        //     //   import message from 'nested-test-pkg';
        //     //   import react from 'react';
        //     //   import axios from 'axios';
        //     //   console.log(message, react, axios);
        //     // `,
        //   };
        // }

        // Check to see if we already have fetched file and it is in the cache data.
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(
          args.path
        );

        // if it is, return it.

        if (cachedResult) {
          return cachedResult;
        }

        const { data, request } = await axios.get(args.path);

        const result: esbuild.OnLoadResult = {
          loader: "jsx",
          contents: data,
          resolveDir: new URL("./", request.responseURL).pathname,
        };

        // ------ Store response in cache -------------
        await fileCache.setItem(args.path, result);

        return result;

        // if (args.path === 'index.js') {
        //   return {
        //     loader: 'jsx',
        //     contents: `
        //       import message from './message';
        //       console.log(message);
        //     `,
        //   };
        // } else {
        //   return {
        //     loader: 'jsx',
        //     contents: 'export default "hi there!"',
        //   };
        // }
        //--------- fetching package from unpkg ---------
        // https://unpkg.com/tiny-test-pkg@1.0.0/index.js
      });
    },
  };
};
