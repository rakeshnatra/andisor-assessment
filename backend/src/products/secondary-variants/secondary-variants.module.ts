import { Module } from '@nestjs/common';
import { SecondaryVariantsController } from './secondary-variants.controller';
import { SecondaryVariantsService } from './secondary-variants.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SecondaryVariantsController],
  providers: [SecondaryVariantsService],
})
export class SecondaryVariantsModule {}