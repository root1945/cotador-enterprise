import { Budget } from '../entities/budget.entity';

export interface IBudgetRepository {
  save(budget: Budget): Promise<void>;
  findAll(): Promise<Budget[]>;
}
