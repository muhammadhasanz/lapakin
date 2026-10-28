import { Container, Service, type UseCase } from '@/shared/index.ts';
import ProductNotFoundError from '../../domain/ProductNotFoundError.ts';
import ProductRepo from '../../repos/ProductRepo.ts';

@Service()
export default class DeleteProduct implements UseCase<number, Promise<void>> {
  constructor(private productRepo: ProductRepo = Container.get(ProductRepo)) {}

  async execute(id: number): Promise<void> {
    const success = await this.productRepo.destroy(id);
    if (!success) {
      throw new ProductNotFoundError();
    }
  }
}
