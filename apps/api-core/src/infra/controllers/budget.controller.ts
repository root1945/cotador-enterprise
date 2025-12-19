import { Body, Controller, Post } from '@nestjs/common';
import { CreateBudgetUseCase } from '../../application/use-cases/create-budget.use-case';
import { CreateBudgetDto } from '../dtos/create-budget.dto';

@Controller('budgets')
export class BudgetController {
  constructor(private createBudgetUseCase: CreateBudgetUseCase) {}

  @Post()
  async create(@Body() body: CreateBudgetDto) {
    return this.createBudgetUseCase.execute({
      clientName: body.clientName,
      items: body.items,
    });
  }
}
