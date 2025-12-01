import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { WalletController } from './wallet.controller';
import { LencoService } from './services/lenco.service';
import { ConvexModule } from '../convex/convex.module';

@Module({
  imports: [ConvexModule],
  controllers: [PaymentsController, WalletController],
  providers: [LencoService],
  exports: [LencoService],
})
export class PaymentsModule {}
