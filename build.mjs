import {build} from 'esbuild';
import {cp,copyFile,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await cp('public','dist',{recursive:true});
await mkdir('dist/vendor',{recursive:true});
for(const [src,dst] of [['node_modules/bootstrap/dist/css/bootstrap.min.css','bootstrap.min.css'],['node_modules/bootstrap/dist/js/bootstrap.bundle.min.js','bootstrap.bundle.min.js'],['node_modules/p5/lib/p5.min.js','p5.min.js']])await copyFile(src,'dist/vendor/'+dst);
await build({entryPoints:['src/app.js','src/art.js'],bundle:true,format:'esm',target:'es2022',outdir:'dist',sourcemap:true});
console.log('Built static site in dist/');
