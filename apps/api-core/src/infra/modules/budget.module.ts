import { Module } from '@nestjs/common';
import { BudgetController } from '../controllers/budget.controller';
import { CreateBudgetUseCase } from '../../application/use-cases/create-budget.use-case';
import { PrismaService } from '../database/prisma/prisma.service';
import { PrismaBudgetRepository } from '../database/repositories/prisma-budget.repository';

@Module({
  controllers: [BudgetController],
  providers: [
    PrismaService,
    {
      provide: CreateBudgetUseCase,
      useFactory: (repo: PrismaBudgetRepository) => new CreateBudgetUseCase(repo),
      inject: [PrismaBudgetRepository],
    },
    PrismaBudgetRepository,
  ],
})
export class BudgetModule {}
