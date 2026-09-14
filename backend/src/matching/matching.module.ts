import { Controller,Get,Req,Param,Query,Module,Injectable,OnModuleDestroy,UseGuards,ParseUUIDPipe,NotFoundException,ServiceUnavailableException } from '@nestjs/common';
import mongoose from 'mongoose';
import { Request } from 'express';
import { Database } from '../database/database';
import { SessionGuard,user } from '../common/access';
import { required } from '../config';
import { missionSelect,matchingMission,scope } from '../missions/missions.service';
import { professional } from '../profiles/profiles.module';
import { match } from '../domain/matching';
const runSchema=new mongoose.Schema({ownerId:{type:String,required:true},missionId:{type:String,required:true},profileVersion:{type:String,required:true},missionVersion:{type:Number,required:true},rulesVersion:{type:String,required:true},result:{type:mongoose.Schema.Types.Mixed,required:true},expiresAt:{type:Date,required:true}},{timestamps:true,strict:'throw'});
runSchema.index({expiresAt:1},{expireAfterSeconds:0});runSchema.index({ownerId:1,missionId:1});
@Injectable()
export class MatchingService implements OnModuleDestroy{
 readonly connection=mongoose.createConnection(required('MONGODB_URI'),{serverSelectionTimeoutMS:2000,bufferCommands:false});
 readonly runs=this.connection.model('MatchingRun',runSchema);
 constructor(private readonly db:Database){this.connection.on('error',()=>{});}
 async ready(){await this.connection.asPromise();await this.runs.init();}
 async onModuleDestroy(){await this.connection.close();}
 async calculate(owner:string,m:any,p:any,conflicts:any[]){
  const result=match(professional(p,conflicts),matchingMission(m));
  try{
   await this.ready();
   const run=await this.runs.create({ownerId:owner,missionId:m.id,profileVersion:new Date(p.updated_at).toISOString()+':'+p.rpps_version,missionVersion:m.version,rulesVersion:'1.0.0',result,expiresAt:new Date(Date.now()+30*86400000)});
   return {...result,missionId:m.id,explanationId:String(run._id),historyStatus:'SAVED'};
  }catch{return {...result,missionId:m.id,explanationId:null,historyStatus:'UNAVAILABLE'};}
 }
 async forNurse(actor:string){
  const [p]=await this.db.query('SELECT * FROM profile WHERE user_id=$1',[actor]);if(!p)throw new NotFoundException();
  const missions=await this.db.query(missionSelect+" WHERE m.status='OPEN' AND m.end_at>now() AND m.qualification=ANY($1) ORDER BY m.start_at,m.id LIMIT 50",[p.qualifications]);
  const conflicts=await this.db.query("SELECT start_at,end_at FROM assignment WHERE nurse_id=$1 AND status='ACTIVE'",[actor]);
  const results=[];for(const m of missions)results.push(await this.calculate(actor,m,p,conflicts));
  return {items:results.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.missionId.localeCompare(b.missionId)),limit:50};
 }
 async forMission(actor:string,id:string){
  const m=await this.db.transaction(async em=>{const [m]=await em.query(missionSelect+' WHERE m.id=$1',[id]);if(!m)throw new NotFoundException();await scope(em,actor,m);return m;});
  const profiles=await this.db.query('SELECT * FROM profile WHERE visible AND $1=ANY(qualifications) ORDER BY user_id LIMIT 50',[m.qualification]);
  const out=[];for(const p of profiles){const conflicts=await this.db.query("SELECT start_at,end_at FROM assignment WHERE nurse_id=$1 AND status='ACTIVE'",[p.user_id]);const result=match(professional(p,conflicts),matchingMission(m));out.push({candidateId:p.user_id,qualifications:p.qualifications,skills:p.skills,...result});}
  return {items:out.sort((a,b)=>(b.score??-1)-(a.score??-1)||a.candidateId.localeCompare(b.candidateId)),limit:50};
 }
 async explanation(actor:string,id:string){
  if(!mongoose.isObjectIdOrHexString(id))throw new NotFoundException();
  let run:any;
  try{await this.ready();run=await this.runs.findOne({_id:id,ownerId:actor,expiresAt:{$gt:new Date()}}).lean();}catch{throw new ServiceUnavailableException('Explanation history unavailable');}
  if(!run)throw new NotFoundException();
  const [current]=await this.db.query('SELECT p.updated_at,p.rpps_version,m.version FROM profile p CROSS JOIN mission m WHERE p.user_id=$1 AND m.id=$2',[actor,run.missionId]);
  const stale=!current||run.profileVersion!==new Date(current.updated_at).toISOString()+':'+current.rpps_version||run.missionVersion!==current.version;
  return {...run,stale,notice:stale?'RECALCULATE_REQUIRED':null};
 }
}
@Controller() @UseGuards(SessionGuard)
class MatchingController{
 constructor(private readonly service:MatchingService){}
 @Get('me/matches')matches(@Req()r:Request){return this.service.forNurse(user(r));}
 @Get('missions/:id/candidates')candidates(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.forMission(user(r),id);}
 @Get('matches/:id/explanation')explanation(@Req()r:Request,@Param('id')id:string){return this.service.explanation(user(r),id);}
}
@Module({providers:[MatchingService],controllers:[MatchingController],exports:[MatchingService]})
export class MatchingModule{}
