import { Module } from '@nestjs/common';
import { PrimaryVariantsService } from './primary-variants.service';
import { PrimaryVariantsController } from './primary-variants.controller';
import { PrismaModule } from '../../prisma/prisma.module';
@Module({
    imports: [PrismaModule],
  controllers: [PrimaryVariantsController],
  providers: [PrimaryVariantsService],
})
export class PrimaryVariantsModule {}
