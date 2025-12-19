import { randomUUID } from 'node:crypto';
import { IBudgetRepository } from '../../domain/repositories/budget-repository.interface';
import { Budget, BudgetItem } from '../../domain/entities/budget.entity';

interface CreateBudgetDto {
  clientName: string;
  items: { description: string; price: number; qty: number }[];
}

export class CreateBudgetUseCase {
  constructor(private budgetRepo: IBudgetRepository) {}

  async execute(input: CreateBudgetDto): Promise<Budget> {
    const total = input.items.reduce((acc, item) => acc + item.price * item.qty, 0);

    const itemsEntities = input.items.map((i) => new BudgetItem(i.description, i.price, i.qty));

    const budget = new Budget(
      randomUUID(),
      input.clientName,
      itemsEntities,
      total,
      'draft',
      new Date()
    );

    await this.budgetRepo.save(budget);

    return budget;
  }
}
