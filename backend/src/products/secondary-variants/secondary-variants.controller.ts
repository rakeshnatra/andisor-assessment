import { Body, Controller, Param, Patch, UsePipes, ValidationPipe } from '@nestjs/common';
import { SecondaryVariantsService } from './secondary-variants.service';
import { UpdateSecondaryVariantDto } from './dto/UpdateSecondaryVariantDto.dto';

// Route base matches what the frontend already calls:
// `http://localhost:3001/secondary-variants/${id}`
@Controller('secondary-variants')
export class SecondaryVariantsController {
  constructor(private readonly secondaryVariantsService: SecondaryVariantsService) {}

  @Patch(':id')
  @UsePipes(ValidationPipe)
  update(@Param('id') id: string, @Body() data: UpdateSecondaryVariantDto) {
    return this.secondaryVariantsService.update(Number(id), data);
  }
}