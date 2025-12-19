import { Controller, Get } from '@nestjs/common';
import { GetServerStatusUseCase } from '../../application/use-cases/get-server-status.use-case';

@Controller('health')
export class HealthController {
  constructor(private readonly getStatusUseCase: GetServerStatusUseCase) {}

  @Get()
  check() {
    return this.getStatusUseCase.execute();
  }
}
