import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePrimaryVariantDto } from './dto/updatePrimaryVariantDto';

@Injectable()
export class PrimaryVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates a single PrimaryVariant row by id.
   *
   * We include `secondaryVariants` in the response the same way
   * ProductsService.getallProducts() does — it costs nothing extra on a
   * single-row update and means the response body is shaped consistently
   * with the rest of the API if a caller ever wants to use it directly
   * instead of re-fetching the whole product list (which is what the
   * current frontend does after every save).
   */
  async update(id: number, data: UpdatePrimaryVariantDto) {
    try {
      return await this.prisma.primaryVariant.update({
        where: { id },
        data,
        include: {
          secondaryVariants: true,
        },
      });
    } catch (error) {
      // Prisma throws P2025 when the record to update doesn't exist —
      // translate that into a proper 404 instead of leaking a raw
      // Prisma error back to the client.
      // if (error?.code === 'P2025') {
      //   throw new NotFoundException(`Primary variant with id ${id} not found`);
      // }
      throw error;
    }
  }
  async remove(id: number) {
  return this.prisma.primaryVariant.delete({
    where: {
      id,
    },
  });
}
}