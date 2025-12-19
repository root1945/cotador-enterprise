export class CreateBudgetItemDto {
  description: string;
  price: number;
  qty: number;
}

export class CreateBudgetDto {
  clientName: string;
  items: CreateBudgetItemDto[];
}
