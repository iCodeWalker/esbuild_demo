import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
import localforage from 'localforage';

// create a new object that we can use to interact with instance of an index database inside the browser.

const fileCache = localforage.createInstance({
    name: 'filecache'
})
 
export const unpkgPathPlugin = (inputCode: string) => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // -- figures out where the required file is stored ---
      build.onResolve({ filter: /.*/ }, async (args: any) => {
        console.log('onResolve', args);
        if(args.path === 'index.js') {
            return { path: args.path, namespace: 'a' };
        } 
        // --- for nested packages --- handled resolution of relative files.

        if(args.path.includes('./') || args.path.includes('../')){
            return {
                namespace:'a',
                path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
            }
        }
        
        // --- for main package ---
        return {
            namespace:'a',
            path: `https://unpkg.com/${args.path}`
        }
        // else if( args.path === 'tiny-test-pkg'){
        //     return {path: 'https://unpkg.com/tiny-test-pkg@1.0.0/index.js', namespace:'a'}
        // }
       
      });
      //-- Attempts to load the file --
      build.onLoad({ filter: /.*/ }, async (args: any) => {
        console.log('onLoad', args);

        if (args.path === 'index.js') {
            return {
              loader: 'jsx',
              contents:inputCode
              // contents: `
              //   import message from 'nested-test-pkg';
              //   import react from 'react';
              //   import axios from 'axios';
              //   console.log(message, react, axios);
              // `,
            };
        } 

        // Check to see if we already have fetched file and it is in the cache data.
        const cachedResult = await fileCache.getItem<esbuild.OnLoadResult>(args.path)

        // if it is, return it.

        if(cachedResult) {
            return cachedResult;
        }

        const {data ,request} = await axios.get(args.path);

        const result: esbuild.OnLoadResult =  {
            loader: 'jsx',
            contents: data,
            resolveDir: new URL('./', request.responseURL).pathname
        }

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