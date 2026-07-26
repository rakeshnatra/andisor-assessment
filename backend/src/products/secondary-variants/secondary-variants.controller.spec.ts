import { Test, TestingModule } from '@nestjs/testing';
import { SecondaryVariantsController } from './secondary-variants.controller';
import { SecondaryVariantsService } from './secondary-variants.service';

describe('SecondaryVariantsController', () => {
  let controller: SecondaryVariantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecondaryVariantsController],
      providers: [SecondaryVariantsService],
    }).compile();

    controller = module.get<SecondaryVariantsController>(SecondaryVariantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
