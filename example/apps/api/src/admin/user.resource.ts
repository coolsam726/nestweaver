import { User } from '../database/user.schema';
import { UserResourceBase } from '@weaver/velm/base';

export class UserResource extends UserResourceBase {
  static override model = User;
}
