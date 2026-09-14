import 'reflect-metadata';
import './config';
import { Command } from 'commander';
import { Database } from './database/database';
const cli=new Command().name('infimatch').description('InfiMatch backend administration').version('0.1.0');
cli.command('migrate').description('Apply explicit SQL migrations').action(async()=>{const db=await new Database().connect();try{const result=await db.source.runMigrations();console.log(JSON.stringify({migrations:result.map(m=>m.name)}));}finally{await db.onModuleDestroy();}});
cli.command('link-organizations').requiredOption('--agency <uuid>').requiredOption('--establishment <uuid>').description('Operator bootstrap: authorize an agency-establishment relationship').action(async(opts)=>{
 const db=await new Database().connect();try{await db.transaction(async em=>{
 const rows=await em.query("SELECT id,kind FROM organization WHERE id IN($1,$2) ORDER BY id FOR UPDATE",[opts.agency,opts.establishment]);
 if(!rows.some((r:any)=>r.id===opts.agency&&r.kind==='AGENCY')||!rows.some((r:any)=>r.id===opts.establishment&&r.kind==='ESTABLISHMENT'))throw new Error('Invalid organization kinds');
 await em.query('INSERT INTO agency_link(agency_id,establishment_id) VALUES($1,$2) ON CONFLICT DO NOTHING',[opts.agency,opts.establishment]);
 });console.log('Organization link recorded');}finally{await db.onModuleDestroy();}
});
void cli.parseAsync().catch(e=>{console.error('Command failed:',e instanceof Error?e.message:'unknown error');process.exitCode=1;});
