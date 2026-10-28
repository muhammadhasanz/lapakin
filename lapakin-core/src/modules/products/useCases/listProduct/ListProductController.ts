import type { Context } from 'hono';
import { Container, Controller, Service, transformAndValidate } from '@/shared/index.ts';
import ListProduct from './ListProduct.ts';
import ListProductDTO from './ListProductDTO.ts';

@Service()
export default class ListProductController extends Controller {
  constructor(private listProduct: ListProduct = Container.get(ListProduct)) {
    super();
  }

  registerRoutes(): void {
    this.router.get('/products', this.index.bind(this));
  }

  async index(c: Context) {
    const query = c.req.query();
    const dto = transformAndValidate(ListProductDTO, query);
    const result = await this.listProduct.execute(dto);
    return this.paginated(c, result.data, result.meta);
  }
}
