// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { PrismaModule } from './prisma/prisma.module';
// import { ProductsModule } from './products/products.module';

// @Module({
//   imports: [PrismaModule, ProductsModule],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { PrimaryVariantsModule } from './products/primary-variants/primary-variants.module';
import { SecondaryVariantsModule } from './products/secondary-variants/secondary-variants.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    // This has to live INSIDE the imports array, not floating above the
    // decorator — Nest only wires up modules that are actually part of
    // this array. As written before, that call ran and returned a
    // DynamicModule object, but nothing ever consumed it, so it was a
    // complete no-op.
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    PrismaModule,
    ProductsModule,
    // These two were missing entirely — that's why PATCH /primary-variants/:id
    // and PATCH /secondary-variants/:id were 404ing. A controller only
    // becomes a live route once its owning module is imported here; the
    // files existing on disk isn't enough.
    PrimaryVariantsModule,
    SecondaryVariantsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}