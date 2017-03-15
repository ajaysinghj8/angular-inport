var path    = require('path');
var Builder = require('systemjs-builder');
var name    = 'inview.module';

var builder = new Builder();
var config = {
  baseURL: './dist',
  transpiler: 'typescript',
  typescriptOptions: {
    module: 'cjs'
  },
  map: {
    typescript: path.resolve('./node_modules/typescript/lib/typescript.js'),
    '@angular': path.resolve('./node_modules/@angular'),
    rxjs: path.resolve('./node_modules/rxjs')
  },
  paths:{
    '*':'*.js',
    'utils/*':'utils/*.js',
    'node_modules/*': './node_modules/*'
  },
  meta: {
    './node_modules/@angular/*': { build: false },
    './node_modules/rxjs/*': { build: false }
  },
};

builder.config(config);

builder
.bundle(name, path.resolve(__dirname, './bundles/', name + '.js'))
.then(function() {
  console.log('Build complete.');
})
.catch(function(err) {
  console.log('Error', err);
});
