import type { Context } from 'hono';
import {
  BadRequestError,
  Container,
  Controller,
  Service,
  transformAndValidate,
} from '@/shared/index.ts';
import { ProductMapper } from '../../mappers/ProductMapper.ts';
import UpdateProduct from './UpdateProduct.ts';
import UpdateProductDTO from './UpdateProductDTO.ts';

@Service()
export default class UpdateProductController extends Controller {
  constructor(private updateProduct: UpdateProduct = Container.get(UpdateProduct)) {
    super();
  }

  registerRoutes(): void {
    this.router.put('/products/:id', this.update.bind(this));
  }

  async update(c: Context) {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid product ID');
    }
    const raw = await c.req.json();
    const dto = transformAndValidate(UpdateProductDTO, raw);
    const product = await this.updateProduct.execute({ id, dto });
    return this.ok(c, ProductMapper.toDTO(product), 'Product updated successfully');
  }
}
