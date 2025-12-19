import { Module } from '@nestjs/common';
import { HealthModule } from './infra/modules/health.module';
import { BudgetModule } from './infra/modules/budget.module';

@Module({
  imports: [HealthModule, BudgetModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
