import { Container, numberToDecimal, Service, type UseCase } from '@/shared/index.ts';
import { Product } from '../../domain/Product.ts';
import ProductCodeAlreadyExistsError from '../../domain/ProductCodeAlreadyExistsError.ts';
import ProductRepo from '../../repos/ProductRepo.ts';
import type CreateProductDTO from './CreateProductDTO.ts';

@Service()
export default class CreateProduct implements UseCase<CreateProductDTO, Promise<Product>> {
  constructor(private productRepo: ProductRepo = Container.get(ProductRepo)) {}

  async execute(req: CreateProductDTO): Promise<Product> {
    const existing = await this.productRepo.findByCode(req.product_code);
    if (existing) {
      throw new ProductCodeAlreadyExistsError();
    }

    const product = Product.create({
      productCode: req.product_code.trim(),
      productName: req.product_name.trim(),
      stock: req.stock,
      price: numberToDecimal(req.price),
    });

    return this.productRepo.save(product);
  }
}
