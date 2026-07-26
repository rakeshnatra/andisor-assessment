import { Test, TestingModule } from '@nestjs/testing';
import { PrimaryVariantsController } from './primary-variants.controller';
import { PrimaryVariantsService } from './primary-variants.service';

describe('PrimaryVariantsController', () => {
  let controller: PrimaryVariantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PrimaryVariantsController],
      providers: [PrimaryVariantsService],
    }).compile();

    controller = module.get<PrimaryVariantsController>(PrimaryVariantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
