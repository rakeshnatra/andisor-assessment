// import { Body, Controller, Get, Post,Patch,Param,  UsePipes, ValidationPipe } from '@nestjs/common';
// import { ProductsService } from './products.service';
// import { CreateProductDto } from './dto/createProductDto.dto';

// @Controller('products')
// export class ProductsController {
//   constructor(private readonly productsService: ProductsService) {}

//   @Get('ids')
//   getProductIds() {
//     return this.productsService.findIds();
//   }
//   @Get()
//   getAllProducts() {
//     return this.productsService.getallProducts();
//   }


//   @Post()
//   @UsePipes(ValidationPipe)
//   create(@Body() CreateProductDto: CreateProductDto) {
//     return this.productsService.create(CreateProductDto);
//   }
//   @Patch(':id')
// updateProduct(
//   @Param('id') id: string,
//   @Body() data: Partial<CreateProductDto>,
// ) {
//   return this.productsService.update(Number(id), data);
// }


// }

import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Param,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/createProductDto.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('ids')
  getProductIds() {
    return this.productsService.findIds();
  }
  @Get()
  getAllProducts() {
    return this.productsService.getallProducts();
  }

  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() CreateProductDto: CreateProductDto) {
    return this.productsService.create(CreateProductDto);
  }
  @Patch(':id')
  updateProduct(@Param('id') id: string, @Body() data: Partial<CreateProductDto>) {
    return this.productsService.update(Number(id), data);
  }
@Delete(':id')
remove(@Param('id') id: string) {
  return this.productsService.remove(Number(id));
}
  /**
   * Bulk product upload.
   * Accepts a single JSON file (multipart/form-data, field name "file")
   * containing an array of products, e.g.:
   *   curl -F "file=@products.json" http://localhost:3001/products/bulk-upload
   *
   * Deliberately does NOT return the created products — it returns as soon
   * as the file is parsed and every product is pushed onto the queue, which
   * is the actual requirement ("response should not wait for creation").
   * The real INSERTs happen later, off the request/response cycle, inside
   * ProductsProcessor.
   */
  @Post('bulk-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      // Memory storage, not disk — we only need the raw JSON bytes for a
      // moment to parse them; there's no reason to write a temp file for
      // this size of payload.
      storage: memoryStorage(),
      // Reject anything that isn't JSON before it even reaches the service —
      // fail fast on obviously wrong uploads (e.g. someone attaching a CSV).
      fileFilter: (_req, file, callback) => {
        const isJson =
          file.mimetype === 'application/json' || file.originalname.endsWith('.json');
        callback(null, isJson);
      },
      limits: {
        // 10MB is a generous cap for a JSON product batch — tune to whatever
        // your largest realistic import file is.
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  bulkUpload(@UploadedFile() file: Express.Multer.File) {
    return this.productsService.queueBulkUpload(file);
  }
}