import { Test, TestingModule } from '@nestjs/testing';
import { OutlookService } from './outlook.service';

describe('OutlookService', () => {
  let service: OutlookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OutlookService],
    }).compile();

    service = module.get<OutlookService>(OutlookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
