import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSecondaryVariantDto } from './dto/UpdateSecondaryVariantDto.dto';

@Injectable()
export class SecondaryVariantsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Updates a single SecondaryVariant row by id.
   * SecondaryVariant is the leaf of the hierarchy (Product -> PrimaryVariant
   * -> SecondaryVariant), so unlike the primary variant update there's
   * nothing further to `include` in the response.
   */
  async update(id: number, data: UpdateSecondaryVariantDto) {
    try {
      return await this.prisma.secondaryVariant.update({
        where: { id },
        data,
      });
    } catch (error) {

      throw error;
    }
  }
  async remove(id: number) {
  return this.prisma.secondaryVariant.delete({
    where: {
      id,
    },
  });
}
}