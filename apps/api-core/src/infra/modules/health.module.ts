import { Module } from '@nestjs/common';
import { HealthController } from '../controllers/health.controller';
import { GetServerStatusUseCase } from '../../application/use-cases/get-server-status.use-case';

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: GetServerStatusUseCase,
      useClass: GetServerStatusUseCase,
    },
  ],
})
export class HealthModule {}
