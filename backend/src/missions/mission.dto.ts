import { IsString,IsUUID,IsIn,IsNumber,Min,Max,Length,IsArray,ArrayUnique,ArrayMaxSize,IsOptional,Matches } from 'class-validator';
export class MissionDto{
 @IsUUID() agencyId!:string; @IsUUID() establishmentId!:string;
 @IsString() @Length(3,150) title!:string; @IsString() @Length(10,8000) description!:string;
 @IsIn(['IDE','IADE','IBODE']) qualification!:'IDE'|'IADE'|'IBODE';
 @Matches(/^[A-Z][A-Z0-9_]{0,79}$/) service!:string;
 @IsIn(['ADULT','PEDIATRIC','MIXED']) population!:'ADULT'|'PEDIATRIC'|'MIXED';
 @IsIn(['NONE','GENERAL','SPECIALIZED']) block!:'NONE'|'GENERAL'|'SPECIALIZED';
 @IsOptional() @Matches(/^[A-Z][A-Z0-9_]{0,79}$/) specialty?:string;
 @IsArray() @ArrayUnique() @ArrayMaxSize(100) @Matches(/^[A-Z][A-Z0-9_]{0,79}$/,{each:true}) requiredSkills!:string[];
 @IsArray() @ArrayUnique() @ArrayMaxSize(100) @Matches(/^[A-Z][A-Z0-9_]{0,79}$/,{each:true}) desiredSkills!:string[];
 @IsNumber() @Min(0) @Max(600) minExperienceMonths!:number;
 @IsString() start!:string; @IsString() end!:string;
 @IsIn(['DAY','NIGHT','MIXED']) shift!:string;
 @IsString() @Length(5,500) address!:string;
 @IsNumber() @Min(-90) @Max(90) latitude!:number; @IsNumber() @Min(-180) @Max(180) longitude!:number;
 @IsNumber({maxDecimalPlaces:2}) @Min(.01) @Max(10000) hourlySalary!:number;
}
