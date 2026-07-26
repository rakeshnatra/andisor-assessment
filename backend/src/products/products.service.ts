// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateProductDto } from './dto/createProductDto.dto';

// @Injectable()
// export class ProductsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async findIds() {
//     return this.prisma.product.findMany({
//       select: {
//         id: true,
//       },
//       orderBy: {
//         id: 'asc',
//       },
//     });
//   }
//   async getallProducts(){    
//  return this.prisma.product.findMany({
//     include: {
//       primaryVariants: {
//         include: {
//           secondaryVariants: true,
//         },
//       },
//     },
//     orderBy: {
//       id: 'asc',
//     },
//   });
// }
// async create(data: CreateProductDto) {
//   return this.prisma.product.create({
//     data: {
//       title: data.title,
//       price: data.price,
//       discountPercentage: data.discountPercentage,
//       inventory: data.inventory,
//       active: data.active,
//       leadTime: data.leadTime,
//       description: data.description,
//       category: data.category,
//       image: data.image,
//       primaryVariantName: data.primaryVariantName,
//       secondaryVariantName: data.secondaryVariantName,

//       primaryVariants: {
//         create: (data.primaryVariants ?? []).map((variant) => ({
//           name: variant.name,
//           price: variant.price,
//           discountPercentage: variant.discountPercentage,
//           inventory: variant.inventory,
//           active: variant.active,

//           secondaryVariants: {
//             create: (variant.secondaryVariants ?? []).map((secondary) => ({
//               name: secondary.name,
//               price: secondary.price,
//               discountPercentage: secondary.discountPercentage,
//               inventory: secondary.inventory,
//             })),
//           },
//         })),
//       },
//     },

//     include: {
//       primaryVariants: {
//         include: {
//           secondaryVariants: true,
//         },
//       },
//     },
//   });
// }
// async update(id: number, data: Partial<CreateProductDto>) {
//   const {
//     primaryVariants,
//     ...productData
//   } = data;

//   return this.prisma.product.update({
//     where: {
//       id,
//     },
//     data: productData,
//   });
// }
// }

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/createProductDto.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    // Injects the "products" queue registered in ProductsModule via
    // BullModule.registerQueue({ name: 'products' }). This is how the
    // controller's request handler hands work off to be done later,
    // instead of doing it inline.
    @InjectQueue('products') private readonly productsQueue: Queue,
  ) {}

  async findIds() {
    return this.prisma.product.findMany({
      select: {
        id: true,
      },
      orderBy: {
        id: 'asc',
      },
    });
  }
  async getallProducts() {
    return this.prisma.product.findMany({
      include: {
        primaryVariants: {
          include: {
            secondaryVariants: true,
          },
        },
      },
      orderBy: {
        id: 'asc',
      },
    });
  }
  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        title: data.title,
        price: data.price,
        discountPercentage: data.discountPercentage,
        inventory: data.inventory,
        active: data.active,
        leadTime: data.leadTime,
        description: data.description,
        category: data.category,
        image: data.image,
            primaryVariantName: data.primaryVariantName,
            secondaryVariantName: data.secondaryVariantName,

    

        primaryVariants: {
          create: (data.primaryVariants ?? []).map((variant) => ({
            name: variant.name,
            price: variant.price,
            discountPercentage: variant.discountPercentage,
            inventory: variant.inventory,
            active: variant.active,

            secondaryVariants: {
              create: (variant.secondaryVariants ?? []).map((secondary) => ({
                name: secondary.name,
                price: secondary.price,
                discountPercentage: secondary.discountPercentage,
                inventory: secondary.inventory,
              })),
            },
          })),
        },
      },

      include: {
        primaryVariants: {
          include: {
            secondaryVariants: true,
          },
        },
      },
    });
  }
  async update(id: number, data: Partial<CreateProductDto>) {
    const { primaryVariants, ...productData } = data;

    return this.prisma.product.update({
      where: {
        id,
      },
      data: productData,
    });
  }

  /**
   * Parses an uploaded JSON file of products and pushes each one onto the
   * "products" BullMQ queue. This method only does structural validation
   * (is it present, is it valid JSON, is it an array) — per-product field
   * validation (title required, price >= 0, etc.) happens later inside
   * ProductsProcessor, right before each product is actually created.
   *
   * That split is intentional: this method's whole job is to return fast.
   * Running class-validator against every product in a 10,000-row file
   * before responding would defeat the purpose of making this async in the
   * first place. A malformed individual product just fails its own job
   * later and shows up in BullMQ's failed set — it doesn't block the
   * response or the rest of the batch.
   */
  async queueBulkUpload(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded. Attach a JSON file under field "file".');
    }

    let products: unknown;

    try {
      products = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('Uploaded file is not valid JSON.');
    }

    if (!Array.isArray(products)) {
      throw new BadRequestException('JSON file must contain an array of products.');
    }

    if (products.length === 0) {
      throw new BadRequestException('Product array is empty — nothing to queue.');
    }

    // One job per product (see design note in products.controller.ts /
    // README) — this is what actually makes creation async and
    // per-item-isolated. queue.add() only writes the job to Redis; it does
    // NOT wait for a worker to pick it up or process it, which is exactly
    // why this method — and therefore the controller response — returns
    // immediately regardless of how many products are in the file.
    const jobs = await Promise.all(
      products.map((product, index) =>
        this.productsQueue.add(
          'create-product',
          { product, sourceIndex: index },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true, // don't let Redis fill up with completed jobs
            removeOnFail: false, // keep failed jobs around so they're inspectable/retryable
          },
        ),
      ),
    );

    return {
      message: `${jobs.length} product(s) queued for processing`,
      queued: jobs.length,
      jobIds: jobs.map((job) => job.id),
    };
  }
}