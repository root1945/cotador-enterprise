import { IsString, IsNumber, IsArray, ValidateNested, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetItemDto {
  @IsString()
  description!: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsNumber()
  @Min(1)
  qty!: number;
}

export class CreateBudgetDto {
  @IsString()
  clientName!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetItemDto)
  items!: CreateBudgetItemDto[];
}
