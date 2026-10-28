import type { Context } from 'hono';
import { BadRequestError, Container, Controller, Service } from '@/shared/index.ts';
import DeleteProduct from './DeleteProduct.ts';

@Service()
export default class DeleteProductController extends Controller {
  constructor(private deleteProduct: DeleteProduct = Container.get(DeleteProduct)) {
    super();
  }

  registerRoutes(): void {
    this.router.delete('/products/:id', this.destroy.bind(this));
  }

  async destroy(c: Context) {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid product ID');
    }
    await this.deleteProduct.execute(id);
    return this.noContent(c);
  }
}
