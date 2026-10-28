import { Container, numberToDecimal, Service, type UseCase } from '@/shared/index.ts';
import { Product } from '../../domain/Product.ts';
import ProductCodeAlreadyExistsError from '../../domain/ProductCodeAlreadyExistsError.ts';
import ProductNotFoundError from '../../domain/ProductNotFoundError.ts';
import ProductRepo from '../../repos/ProductRepo.ts';
import type UpdateProductDTO from './UpdateProductDTO.ts';

export interface UpdateProductRequest {
  id: number;
  dto: UpdateProductDTO;
}

@Service()
export default class UpdateProduct implements UseCase<UpdateProductRequest, Promise<Product>> {
  constructor(private productRepo: ProductRepo = Container.get(ProductRepo)) {}

  async execute(req: UpdateProductRequest): Promise<Product> {
    const existing = await this.productRepo.show(req.id);
    if (!existing) {
      throw new ProductNotFoundError();
    }

    const duplicate = await this.productRepo.findByCode(req.dto.product_code);
    if (duplicate && duplicate.id !== req.id) {
      throw new ProductCodeAlreadyExistsError();
    }

    const updatedEntity = Product.create({
      productCode: req.dto.product_code.trim(),
      productName: req.dto.product_name.trim(),
      stock: req.dto.stock,
      price: numberToDecimal(req.dto.price),
    });

    const result = await this.productRepo.update(req.id, updatedEntity);
    if (!result) {
      throw new ProductNotFoundError();
    }
    return result;
  }
}
