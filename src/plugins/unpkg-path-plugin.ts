import * as esbuild from 'esbuild-wasm';
 
export const unpkgPathPlugin = () => {
  return {
    name: 'unpkg-path-plugin',
    setup(build: esbuild.PluginBuild) {
      // ------- onResolve() figures out where the required file is stored -------

      // ---------- For root entry file index.js  ---------------

      build.onResolve({filter: /(^index\.js$)/}, () => {
        return { path: 'index.js', namespace: 'a' };
      })

      // ----------- For relative paths in modules ------------------

      build.onResolve({filter: /^\.+\//}, (args: any) => {
        return {
          namespace:'a',
          path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
      }
      })


      build.onResolve({ filter: /.*/ }, async (args: any) => {
        // ---------- For root entry file index.js  ---------------

        // if (args.path === 'index.js') {
        //   return { path: args.path, namespace: 'a' };
        // } 

        // --- for nested packages --- handled resolution of relative files.

        // if(args.path.includes('./') || args.path.includes('../')){
        //     return {
        //         namespace:'a',
        //         path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
        //     }
        // }
        
        // ------------- for main package -----------------
        return {
            namespace:'a',
            path: `https://unpkg.com/${args.path}`
        }
        // else if( args.path === 'tiny-test-pkg'){
        //     return {path: 'https://unpkg.com/tiny-test-pkg@1.0.0/index.js', namespace:'a'}
        // }
       
      });
    },
  };
};