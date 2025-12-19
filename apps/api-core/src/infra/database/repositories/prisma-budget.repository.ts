import { Injectable } from '@nestjs/common';
import { IBudgetRepository } from '../../../domain/repositories/budget-repository.interface';
import { Budget, BudgetItem } from '../../../domain/entities/budget.entity';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaBudgetRepository implements IBudgetRepository {
  constructor(private prisma: PrismaService) {}

  async save(budget: Budget): Promise<void> {
    await this.prisma.budget.create({
      data: {
        id: budget.id,
        clientName: budget.clientName,
        total: budget.total,
        status: budget.status,
        createdAt: budget.createdAt,
        items: {
          create: budget.items.map((item) => ({
            description: item.description,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
          })),
        },
      },
    });
  }

  async findAll(): Promise<Budget[]> {
    const data = await this.prisma.budget.findMany({
      include: { items: true },
    });
    return data.map(
      (d) =>
        new Budget(
          d.id,
          d.clientName,
          d.items.map((i) => new BudgetItem(i.description, Number(i.unitPrice), i.quantity)),
          Number(d.total),
          d.status,
          d.createdAt
        )
    );
  }
}
