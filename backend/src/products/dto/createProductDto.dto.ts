// import {
//   IsBoolean,
//   IsInt,
//   IsNumber,
//   IsString,
//   IsUrl,
//   Max,
//   Min,
// } from 'class-validator';

// export class CreateProductDto {
//   @IsString()
//   title!: string;

//   @IsNumber()
//   @Min(0)
//   price!: number;

//   @IsNumber()
//   @Min(0)
//   @Max(100)
//   discountPercentage!: number;

//   @IsInt()
//   @Min(0)
//   inventory!: number;

//   @IsBoolean()
//   active!: boolean;

//   @IsString()
//   leadTime!: string;

//   @IsString()
//   description!: string;

//   @IsString()
//   category!: string;

//   @IsUrl()
//   image!: string;

//   @IsString()
//   primaryVariantName!: string;

//   @IsString()
//   secondaryVariantName!: string;
// }
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,IsInt, 
  ValidateNested,
} from 'class-validator';

export class CreateSecondaryVariantDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage!: number;

  @IsNumber()
  @Min(0)
  inventory!: number;
}

export class CreatePrimaryVariantDto {
  @IsString()
  name!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage!: number;

  @IsNumber()
  @Min(0)
  inventory!: number;

  @IsBoolean()
  active!: boolean;

  // @ValidateNested({ each: true }) is the actual fix for the array-of-objects
  // problem: without `each: true`, class-validator tries to nested-validate
  // the ARRAY itself as if it were a single object, which is exactly the
  // "unknown value" failure mode. @Type(() => CreateSecondaryVariantDto) is
  // what tells class-transformer to turn each plain array element into a
  // real CreateSecondaryVariantDto instance before validation runs — without
  // it, the elements stay as plain objects and nested validation still fails.
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSecondaryVariantDto)
  secondaryVariants?: CreateSecondaryVariantDto[];
}

export class CreateProductDto {
  @IsString()
  title!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  inventory!: number;

  @IsOptional()
  @IsBoolean()
  active!: boolean;

  @IsString()
  leadTime!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsUrl()
  image!: string;

  @IsOptional()
  @IsString()
  primaryVariantName!: string;

  @IsOptional()
  @IsString()
  secondaryVariantName!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePrimaryVariantDto)
  primaryVariants?: CreatePrimaryVariantDto[];
}