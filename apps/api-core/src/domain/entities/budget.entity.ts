export class BudgetItem {
  constructor(
    public description: string,
    public unitPrice: number,
    public quantity: number
  ) {}
}

export class Budget {
  constructor(
    public id: string,
    public clientName: string,
    public items: BudgetItem[],
    public total: number,
    public status: string,
    public createdAt: Date
  ) {}

  canApprove(): boolean {
    return this.items.length > 0;
  }
}
