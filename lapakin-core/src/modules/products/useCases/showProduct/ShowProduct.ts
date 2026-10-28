import { Container, Service, type UseCase } from '@/shared/index.ts';
import type { Product } from '../../domain/Product.ts';
import ProductNotFoundError from '../../domain/ProductNotFoundError.ts';
import ProductRepo from '../../repos/ProductRepo.ts';

@Service()
export default class ShowProduct implements UseCase<number, Promise<Product>> {
  constructor(private productRepo: ProductRepo = Container.get(ProductRepo)) {}

  async execute(id: number): Promise<Product> {
    const product = await this.productRepo.show(id);
    if (!product) {
      throw new ProductNotFoundError();
    }
    return product;
  }
}
