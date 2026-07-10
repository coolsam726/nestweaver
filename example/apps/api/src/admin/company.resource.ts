import { Company } from '../database/company.schema';
import { CompanyResourceBase } from '@weaver/velm/base';

export class CompanyResource extends CompanyResourceBase {
  static override model = Company;
}
