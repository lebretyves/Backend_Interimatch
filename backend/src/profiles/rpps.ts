import { Injectable } from '@nestjs/common';
import { Database,audit } from '../database/database';
import { nurse } from '../common/access';
export type RppsResult={status:'FOUND'|'NOT_FOUND'|'PENDING';reason:string};
export async function lookupRpps(number:string,apiKey:string|undefined,transport:typeof fetch=fetch):Promise<RppsResult>{
 if(!apiKey)return {status:'PENDING',reason:'CREDENTIALS_MISSING'};
 try{
  const url=new URL('https://gateway.api.esante.gouv.fr/fhir/v2/Practitioner');
  url.searchParams.set('identifier','urn:oid:1.2.250.1.71.4.2.1|'+number);
  const res=await transport(url,{headers:{'ESANTE-API-KEY':apiKey,Accept:'application/fhir+json'},signal:AbortSignal.timeout(8000)});
  if(!res.ok)return {status:'PENDING',reason:'PROVIDER_UNAVAILABLE'};
  const data:any=await res.json();
  if(data.resourceType!=='Bundle'||data.type!=='searchset'||!Number.isInteger(data.total)||data.total<0)return {status:'PENDING',reason:'INVALID_RESPONSE'};
  if(data.total===0&&(!data.entry||Array.isArray(data.entry)&&data.entry.length===0))return {status:'NOT_FOUND',reason:'EMPTY_EXACT_SEARCH'};
  if(Array.isArray(data.entry)&&data.entry.some((e:any)=>e.resource?.resourceType==='Practitioner'&&Array.isArray(e.resource.identifier)&&e.resource.identifier.some((i:any)=>i.system==='urn:oid:1.2.250.1.71.4.2.1'&&i.value===number)))return {status:'FOUND',reason:'EXACT_IDENTIFIER_FOUND'};
  return {status:'PENDING',reason:'INCONSISTENT_RESPONSE'};
 }catch{return {status:'PENDING',reason:'PROVIDER_UNAVAILABLE'};}
}
@Injectable()
export class RppsService{
 constructor(private readonly db:Database){}
 async verify(actor:string,number:string){
  const version=await this.db.transaction(async em=>{
   await nurse(em,actor);
   const [p]=await em.query("UPDATE profile SET rpps_number=$2,rpps_status='PENDING',rpps_version=rpps_version+1,rpps_checked_at=NULL WHERE user_id=$1 RETURNING rpps_version",[actor,number]);
   await audit(em,actor,'RPPS_REQUESTED',actor,{version:p.rpps_version});return p.rpps_version;
  });
  const result=await lookupRpps(number,process.env.RPPS_API_KEY);
  return this.db.transaction(async em=>{
   await nurse(em,actor);
   const rows=await em.query('UPDATE profile SET rpps_status=$4,rpps_checked_at=now() WHERE user_id=$1 AND rpps_number=$2 AND rpps_version=$3 RETURNING rpps_status',[actor,number,version,result.status]);
   if(!rows.length)return {status:'STALE_RESULT_IGNORED'};
   await audit(em,actor,'RPPS_RESULT',actor,{version,...result});return result;
  });
 }
}
