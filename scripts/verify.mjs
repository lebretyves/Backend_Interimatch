import {spawnSync} from 'node:child_process';import {mkdirSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');mkdirSync(resolve(root,'docs/proofs'),{recursive:true});
const commands=[['typecheck'],['build'],['coverage']];const results=[];
for(const [name] of commands){const r=spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run',name],{cwd:root,encoding:'utf8',shell:process.platform==='win32'});writeFileSync(resolve(root,'docs/proofs/'+name+'.txt'),(r.stdout??'')+(r.stderr??''));results.push({command:'npm run '+name,exitCode:r.status});if(r.status!==0)break;}
writeFileSync(resolve(root,'docs/proofs/verification.json'),JSON.stringify({date:new Date().toISOString(),results},null,2));console.log(JSON.stringify(results,null,2));if(results.some(r=>r.exitCode!==0))process.exitCode=1;
