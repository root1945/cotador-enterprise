import { ServerStatus } from '../../domain/entities/server-status.entity';

export class GetServerStatusUseCase {
  execute(): ServerStatus {
    return new ServerStatus('ok', new Date(), '1.0.0');
  }
}
