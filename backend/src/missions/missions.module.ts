import { Body,Controller,Post,Put,Get,Param,Req,Headers,Module,UseGuards,ParseUUIDPipe } from '@nestjs/common';
import { IsInt,Min,IsUUID } from 'class-validator';
import { Request } from 'express';
import { SessionGuard,user } from '../common/access';
import { Database } from '../database/database';
import { MissionsService,missionSelect,scope } from './missions.service';
import { MissionDto } from './mission.dto';
class ConsentDto{@IsInt() @Min(1) version!:number;}
class AssignmentDto{@IsUUID() applicationId!:string;}
@Controller() @UseGuards(SessionGuard)
class MissionsController{
 constructor(private readonly service:MissionsService,private readonly db:Database){}
 @Post('missions')create(@Req()r:Request,@Body()b:MissionDto){return this.service.create(user(r),b);}
 @Put('missions/:id')edit(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string,@Body()b:MissionDto){return this.service.edit(user(r),id,b);}
 @Post('missions/:id/publish')publish(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.transition(user(r),id,'publish');}
 @Post('missions/:id/cancel')cancel(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.transition(user(r),id,'cancel');}
 @Post('missions/:id/reopen')reopen(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.transition(user(r),id,'reopen');}
 @Post('missions/:id/complete')complete(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.transition(user(r),id,'complete');}
 @Post('missions/:id/applications')apply(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string,@Body()b:ConsentDto){return this.service.apply(user(r),id,b.version);}
 @Post('applications/:id/withdrawal')withdraw(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.applicationAction(user(r),id,'WITHDRAWN');}
 @Post('applications/:id/selection')select(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.applicationAction(user(r),id,'SELECTED');}
 @Post('applications/:id/rejection')reject(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.service.applicationAction(user(r),id,'REJECTED');}
 @Post('missions/:id/assignments')assign(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string,@Body()b:AssignmentDto,@Headers('idempotency-key')key:string){return this.service.assign(user(r),id,b.applicationId,key);}
 @Get('me/applications')applications(@Req()r:Request){return this.db.query('SELECT a.*,m.title,m.version AS current_version,(a.consent_version!=m.version) AS requires_reconsent FROM application a JOIN mission m ON m.id=a.mission_id WHERE a.nurse_id=$1 ORDER BY a.updated_at DESC,a.id LIMIT 50',[user(r)]);}
 @Get('missions')missions(@Req()r:Request){return this.db.query(missionSelect+' WHERE EXISTS(SELECT 1 FROM membership o WHERE o.user_id=$1 AND o.active AND o.organization_id IN(m.agency_id,m.establishment_id)) ORDER BY m.created_at DESC,m.id LIMIT 50',[user(r)]);}
 @Get('missions/:id/applications')async candidates(@Req()r:Request,@Param('id',ParseUUIDPipe)id:string){return this.db.transaction(async em=>{const [m]=await em.query('SELECT * FROM mission WHERE id=$1',[id]);await scope(em,user(r),m??{});return em.query('SELECT a.*,p.display_name,p.qualifications,p.skills,p.rpps_status FROM application a JOIN profile p ON p.user_id=a.nurse_id WHERE a.mission_id=$1 ORDER BY a.updated_at DESC,a.id LIMIT 50',[id]);});}
}
@Module({controllers:[MissionsController],providers:[MissionsService],exports:[MissionsService]})
export class MissionsModule{}
