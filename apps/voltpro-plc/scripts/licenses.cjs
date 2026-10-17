/* Include complete installed dependency notices with the generated public app. */
const fs=require('node:fs'),path=require('node:path');
const base=path.resolve('node_modules'),dirs=[];let text='# VoltProPLC dependency license notices\n\n';
for(const name of fs.readdirSync(base)){if(name.startsWith('.'))continue;const loc=path.join(base,name);if(name.startsWith('@'))for(const child of fs.readdirSync(loc))dirs.push(path.join(loc,child));else dirs.push(loc);}
for(const dir of dirs){if(!fs.statSync(dir).isDirectory())continue;const pp=path.join(dir,'package.json');if(!fs.existsSync(pp))continue;const pkg=JSON.parse(fs.readFileSync(pp,'utf8')),files=fs.readdirSync(dir).filter(x=>/^(LICENSE|LICENCE|COPYING)(\.|$)/i.test(x));if(!files.length)continue;text+='\n## '+pkg.name+' '+pkg.version+' ('+pkg.license+')\n\n';for(const f of files){const file=path.join(dir,f);if(fs.statSync(file).isFile())text+=fs.readFileSync(file,'utf8')+'\n';}}
fs.writeFileSync(path.resolve('../../voltpro-plc/DEPENDENCY_LICENSES.txt'),text);
