import { Container, Service, type UseCase } from '@/shared/index.ts';
import DashboardRepo, { type DashboardSummaryData } from '../../repos/DashboardRepo.ts';

@Service()
export default class GetDashboardSummary implements UseCase<void, Promise<DashboardSummaryData>> {
  constructor(private dashboardRepo: DashboardRepo = Container.get(DashboardRepo)) {}

  async execute(): Promise<DashboardSummaryData> {
    return this.dashboardRepo.getSummary();
  }
}
