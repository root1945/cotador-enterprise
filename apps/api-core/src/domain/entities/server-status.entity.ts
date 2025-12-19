export class ServerStatus {
  constructor(
    public readonly status: 'ok' | 'error',
    public readonly timestamp: Date,
    public readonly version: string
  ) {}
}
