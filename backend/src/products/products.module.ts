// import { Module } from '@nestjs/common';
// import { ProductsController } from './products.controller';
// import { ProductsService } from './products.service';
// import { PrismaModule } from '../prisma/prisma.module';
// import { PrimaryVariantsModule } from './primary-variants/primary-variants.module';
// import { SecondaryVariantsModule } from './secondary-variants/secondary-variants.module';

// @Module({
//   imports: [PrismaModule, PrimaryVariantsModule, SecondaryVariantsModule],
//   controllers: [ProductsController],
//   providers: [ProductsService],
// })
// export class ProductsModule {}
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsProcessor } from './products.processor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    // Registers the "products" queue with this module. The actual Redis
    // connection details live in BullModule.forRoot(...) in app.module.ts
    // (root-level config, shared across all queues in the app) — this call
    // just declares "this module uses a queue named 'products'" and makes
    // an injectable Queue<'products'> available via @InjectQueue('products').
    BullModule.registerQueue({
      name: 'products',
    }),
  ],
  controllers: [ProductsController],
  // ProductsProcessor is the worker that actually consumes jobs off the
  // queue and calls ProductsService.create() — it has to be registered
  // as a provider here (same as any injectable) or Nest won't instantiate
  // the worker and nothing will ever process the queued jobs.
  providers: [ProductsService, ProductsProcessor],
})
export class ProductsModule {}