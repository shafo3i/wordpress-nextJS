import { verifyAdminOrEditor } from "@/lib/authMIddleware";
import {
  getUsersList as getListFromService,
  getUsersCounts as getCountsFromService,
  getAvailableRoles as getRolesFromService,
  UserItem,
  UserRoleOption,
  Counts,
  UsersListParams,
} from "@/services/user.service";

export type { UserItem, UserRoleOption, Counts, UsersListParams };

export async function getUsers(params: UsersListParams = {}) {
  await verifyAdminOrEditor();
  return await getListFromService(params);
}

export async function getUsersCounts(): Promise<Counts> {
  await verifyAdminOrEditor();
  return await getCountsFromService();
}

export async function getAvailableRoles(): Promise<UserRoleOption[]> {
  await verifyAdminOrEditor();
  return await getRolesFromService();
}
