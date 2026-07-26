import { Test, TestingModule } from '@nestjs/testing';
import { SecondaryVariantsService } from './secondary-variants.service';

describe('SecondaryVariantsService', () => {
  let service: SecondaryVariantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecondaryVariantsService],
    }).compile();

    service = module.get<SecondaryVariantsService>(SecondaryVariantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
