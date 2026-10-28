// Auth Controllers
import LoginController from '@/modules/auth/useCases/login/LoginController.ts';
import LogoutController from '@/modules/auth/useCases/logout/LogoutController.ts';
import MeController from '@/modules/auth/useCases/me/MeController.ts';
import RefreshController from '@/modules/auth/useCases/refresh/RefreshController.ts';
import CreateCustomerController from '@/modules/customers/useCases/createCustomer/CreateCustomerController.ts';
import DeleteCustomerController from '@/modules/customers/useCases/deleteCustomer/DeleteCustomerController.ts';
// Customer Controllers
import ListCustomerController from '@/modules/customers/useCases/listCustomer/ListCustomerController.ts';
import ShowCustomerController from '@/modules/customers/useCases/showCustomer/ShowCustomerController.ts';
import UpdateCustomerController from '@/modules/customers/useCases/updateCustomer/UpdateCustomerController.ts';
// Dashboard Controllers
import GetDashboardSummaryController from '@/modules/dashboard/useCases/getDashboardSummary/GetDashboardSummaryController.ts';
// Order Controllers
import CreateOrderController from '@/modules/orders/useCases/createOrder/CreateOrderController.ts';
import ListOrderController from '@/modules/orders/useCases/listOrder/ListOrderController.ts';
import ShowOrderController from '@/modules/orders/useCases/showOrder/ShowOrderController.ts';
import CreateProductController from '@/modules/products/useCases/createProduct/CreateProductController.ts';
import DeleteProductController from '@/modules/products/useCases/deleteProduct/DeleteProductController.ts';
// Product Controllers
import ListProductController from '@/modules/products/useCases/listProduct/ListProductController.ts';
import ShowProductController from '@/modules/products/useCases/showProduct/ShowProductController.ts';
import UpdateProductController from '@/modules/products/useCases/updateProduct/UpdateProductController.ts';
import { App as AppBase, type Constructor, type Controller } from '@/shared/index.ts';
import generateTraceId from './middleware/generateTraceId.ts';
import requestLogger from './middleware/requestLogger.ts';
import requireAuth from './middleware/requireAuth.ts';

class App extends AppBase {
  protected override registerMiddleware(): void {
    super.registerMiddleware();

    this.app.use(generateTraceId);
    this.app.use(requestLogger);
    this.app.use(requireAuth);

    this.app.get('/health', (c) => {
      return c.json({ success: true, message: 'OK', data: { status: 'healthy' } });
    });
  }
}

const controllers: (Constructor<Controller> | Controller)[] = [
  // Auth
  LoginController,
  RefreshController,
  LogoutController,
  MeController,

  // Products
  ListProductController,
  ShowProductController,
  CreateProductController,
  UpdateProductController,
  DeleteProductController,

  // Customers
  ListCustomerController,
  ShowCustomerController,
  CreateCustomerController,
  UpdateCustomerController,
  DeleteCustomerController,

  // Orders
  CreateOrderController,
  ListOrderController,
  ShowOrderController,

  // Dashboard
  GetDashboardSummaryController,
];

const app = new App(controllers);

export default app;
