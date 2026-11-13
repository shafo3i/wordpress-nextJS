import "server-only";
import { verifyAdmin } from "@/lib/authMIddleware";
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
  await verifyAdmin();
  return await getListFromService(params);
}

export async function getUsersCounts(): Promise<Counts> {
  await verifyAdmin();
  return await getCountsFromService();
}

export async function getAvailableRoles(): Promise<UserRoleOption[]> {
  await verifyAdmin();
  return await getRolesFromService();
}
