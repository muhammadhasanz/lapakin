import type { Context } from 'hono';
import { BadRequestError, Container, Controller, Service } from '@/shared/index.ts';
import { ProductMapper } from '../../mappers/ProductMapper.ts';
import ShowProduct from './ShowProduct.ts';

@Service()
export default class ShowProductController extends Controller {
  constructor(private showProduct: ShowProduct = Container.get(ShowProduct)) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/products/:id', this.show.bind(this));
  }

  async show(c: Context) {
    const id = Number(c.req.param('id'));
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestError('Invalid product ID');
    }
    const product = await this.showProduct.execute(id);
    return this.ok(c, ProductMapper.toDTO(product));
  }
}
