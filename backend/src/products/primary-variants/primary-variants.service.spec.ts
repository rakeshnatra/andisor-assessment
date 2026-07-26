import { Test, TestingModule } from '@nestjs/testing';
import { PrimaryVariantsService } from './primary-variants.service';

describe('PrimaryVariantsService', () => {
  let service: PrimaryVariantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrimaryVariantsService],
    }).compile();

    service = module.get<PrimaryVariantsService>(PrimaryVariantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
