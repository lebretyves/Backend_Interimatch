import { Global, Injectable, Module, OnModuleDestroy } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { required } from '../config';
import { InitialSchema1789380000000 } from './schema';
@Injectable()
export class Database implements OnModuleDestroy{
 readonly source=new DataSource({type:'postgres',url:required('DATABASE_URL'),synchronize:false,migrations:[InitialSchema1789380000000],logging:false,extra:{max:12}});
 async connect(){if(!this.source.isInitialized)await this.source.initialize();return this;}
 query(sql:string,parameters:unknown[]=[]):Promise<any[]>{return this.source.query(sql,parameters);}
 transaction<T>(fn:(em:EntityManager)=>Promise<T>):Promise<T>{return this.source.transaction(fn);}
 async onModuleDestroy(){if(this.source.isInitialized)await this.source.destroy();}
}
@Global()
@Module({providers:[{provide:Database,useFactory:async()=>new Database().connect()}],exports:[Database]})
export class DatabaseModule{}
export async function audit(em:EntityManager,actor:string|null,event:string,id:string|null,details:unknown={}){
 await em.query('INSERT INTO audit(actor_id,event,resource_id,details) VALUES($1,$2,$3,$4)',[actor,event,id,JSON.stringify(details)]);
}
export async function event(em:EntityManager,name:string,payload:unknown){await em.query('INSERT INTO outbox(event,payload) VALUES($1,$2)',[name,JSON.stringify(payload)]);}
