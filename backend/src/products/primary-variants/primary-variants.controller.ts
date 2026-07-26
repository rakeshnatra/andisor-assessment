import { Body, Controller, Param, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { PrimaryVariantsService } from './primary-variants.service';
import { UpdatePrimaryVariantDto } from './dto/updatePrimaryVariantDto';

// Route base matches what the frontend already calls:
// `http://localhost:3001/primary-variants/${id}`
@Controller('primary-variants')
export class PrimaryVariantsController {
  constructor(private readonly primaryVariantsService: PrimaryVariantsService) {}

  @Patch(':id')
  @UsePipes(ValidationPipe)
  update(@Param('id') id: string, @Body() data: UpdatePrimaryVariantDto) {
    // Route params always arrive as strings — cast to number for Prisma,
    // same pattern ProductsController.updateProduct already uses.
    return this.primaryVariantsService.update(Number(id), data);
  }
}