import * as esbuild from 'esbuild-wasm';
import axios from 'axios';
 
export const unpkgPathPlugin = () => {
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
              contents: `
                import message from 'nested-test-pkg';
                console.log(message);
              `,
            };
        } 
        const {data ,request} = await axios.get(args.path);
        return {
            loader: 'jsx',
            contents: data,
            resolveDir: new URL('./', request.responseURL).pathname
        }
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