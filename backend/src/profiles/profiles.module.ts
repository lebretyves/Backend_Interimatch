import { Body, Controller, Get, Put, Post, Req, Module, Injectable, UseGuards, BadRequestException } from '@nestjs/common';
import { IsString, IsArray, IsIn, IsNumber, IsBoolean, IsOptional, Min, Max, Length, ArrayMaxSize, ArrayUnique, ValidateNested, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { Request } from 'express';
import { Database,audit } from '../database/database';
import { nurse,user,SessionGuard } from '../common/access';
import { interval,Professional } from '../domain/matching';
import { RppsService } from './rpps';
export class PeriodDto { @IsString() start!:string; @IsString() end!:string; }
class ExperienceDto extends PeriodDto {@IsString() @Length(1,80) service!:string;}
export class ProfileDto {
 @IsString() @Length(2,100) displayName!:string;
 @IsArray() @ArrayUnique() @ArrayMaxSize(3) @IsIn(['IDE','IADE','IBODE'],{each:true}) qualifications!:('IDE'|'IADE'|'IBODE')[];
 @IsArray() @ArrayUnique() @ArrayMaxSize(100) @Matches(/^[A-Z][A-Z0-9_]{0,79}$/,{each:true}) skills!:string[];
 @IsArray() @ArrayMaxSize(100) @ValidateNested({each:true}) @Type(()=>ExperienceDto) experience!:ExperienceDto[];
 @IsArray() @ArrayMaxSize(200) @ValidateNested({each:true}) @Type(()=>PeriodDto) available!:PeriodDto[];
 @IsArray() @ArrayMaxSize(200) @ValidateNested({each:true}) @Type(()=>PeriodDto) unavailable!:PeriodDto[];
 @IsNumber() @Min(-90) @Max(90) latitude!:number;
 @IsNumber() @Min(-180) @Max(180) longitude!:number;
 @IsNumber() @Min(.1) @Max(1000) radiusKm!:number;
 @IsArray() @ArrayUnique() @ArrayMaxSize(2) @IsIn(['DAY','NIGHT'],{each:true}) acceptedShifts!:string[];
 @IsArray() @ArrayUnique() @ArrayMaxSize(2) @IsIn(['DAY','NIGHT'],{each:true}) preferredShifts!:string[];
 @IsBoolean() visible!:boolean;
}
class RppsDto {@Matches(/^\d{11}$/) number!:string;}
export function professional(p:any,conflicts:any[]=[]):Professional{
 return {qualifications:p.qualifications,skills:p.skills,experience:p.experience,available:p.available,unavailable:p.unavailable,conflicts:conflicts.map(a=>({start:new Date(a.start_at).toISOString(),end:new Date(a.end_at).toISOString()})),rppsStatus:p.rpps_status,latitude:p.latitude,longitude:p.longitude,radiusKm:p.radius_km,acceptedShifts:p.accepted_shifts,preferredShifts:p.preferred_shifts};
}
@Injectable()
export class ProfilesService {
 constructor(private readonly db:Database){}
 async update(actor:string,b:ProfileDto){
  try{for(const i of [...b.available,...b.unavailable,...b.experience])interval(i);}catch{throw new BadRequestException('Invalid interval or missing timezone');}
  if(b.qualifications.some(q=>q!=='IDE')&&!b.qualifications.includes('IDE'))throw new BadRequestException('Complete the IDE qualification explicitly');
  if(b.preferredShifts.some(s=>!b.acceptedShifts.includes(s)))throw new BadRequestException('Preferred shift must be accepted');
  return this.db.transaction(async em=>{
   await nurse(em,actor);
   await em.query('UPDATE profile SET display_name=$2,qualifications=$3,skills=$4,experience=$5,available=$6,unavailable=$7,latitude=$8,longitude=$9,radius_km=$10,accepted_shifts=$11,preferred_shifts=$12,visible=$13,updated_at=now() WHERE user_id=$1',[actor,b.displayName,b.qualifications,b.skills,JSON.stringify(b.experience),JSON.stringify(b.available),JSON.stringify(b.unavailable),b.latitude,b.longitude,b.radiusKm,b.acceptedShifts,b.preferredShifts,b.visible]);
   await audit(em,actor,'PROFILE_UPDATED',actor);return {ok:true};
  });
 }
}
@Controller('profile') @UseGuards(SessionGuard)
class ProfilesController {
 constructor(private readonly db:Database,private readonly profiles:ProfilesService,private readonly rpps:RppsService){}
 @Get() async get(@Req()req:Request){return this.db.transaction(async em=>nurse(em,user(req)));}
 @Put() update(@Req()req:Request,@Body()b:ProfileDto){return this.profiles.update(user(req),b);}
 @Put('rpps') rppsCheck(@Req()req:Request,@Body()b:RppsDto){return this.rpps.verify(user(req),b.number);}
 @Post('rpps/retry') async retry(@Req()req:Request){const [p]=await this.db.query('SELECT rpps_number FROM profile WHERE user_id=$1',[user(req)]);if(!p?.rpps_number)throw new BadRequestException('RPPS missing');return this.rpps.verify(user(req),p.rpps_number);}
}
@Module({controllers:[ProfilesController],providers:[ProfilesService,RppsService],exports:[RppsService,ProfilesService]})
export class ProfilesModule{}
