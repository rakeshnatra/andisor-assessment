import { Logger } from '@nestjs/common';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/createProductDto.dto';

@Processor('products')
export class ProductsProcessor extends WorkerHost {
  private readonly logger = new Logger(ProductsProcessor.name);

  constructor(private readonly productsService: ProductsService) {
    super();
    // If this line never prints on app startup, the processor was never
    // instantiated at all — which usually means it's missing from a
    // module's `providers` array, or the module itself was never imported.
    this.logger.log('ProductsProcessor initialized — worker is ready to consume jobs');
  }

  async process(job: Job<{ product: unknown; sourceIndex: number }>): Promise<unknown> {
    const { product, sourceIndex } = job.data;

    const dto = plainToInstance(CreateProductDto, product);

    // TEMPORARY — remove once the validation issue is diagnosed.
    this.logger.debug(`raw product: ${JSON.stringify(product)}`);
    this.logger.debug(`dto typeof: ${typeof dto}, is instance: ${dto instanceof CreateProductDto}`);

    const errors = await validate(dto);

    if (errors.length > 0) {
      const details = errors
        .map((error) => Object.values(error.constraints ?? {}).join(', '))
        .join('; ');

      throw new Error(`Product at index ${sourceIndex} failed validation: ${details}`);
    }

    const created = await this.productsService.create(dto);

    this.logger.log(
      `Created product "${created.title}" (id ${created.id}) from bulk-upload job ${job.id} (source index ${sourceIndex})`,
    );

    return created;
  }

  /**
   * Without these two listeners, BullMQ processes jobs silently by default —
   * a thrown error inside process() marks the job "failed" in Redis, but
   * nothing prints to your console unless you explicitly listen for it.
   * That silence is almost certainly why it looks like "nothing happened"
   * even though the job did run and did fail.
   */
  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job?.id} FAILED: ${error.message}`);
  }

  @OnWorkerEvent('active')
  onActive(job: Job) {
    this.logger.debug(`Job ${job.id} started processing`);
  }
}