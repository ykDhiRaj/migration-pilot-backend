import { NotFoundError } from '@core/errors';
import {
  findUserById,
  updateUserById,
  // stripPassword,
  PublicUser,
  deleteUserById,
} from './users.repository';
import { UpdateProfileDto } from './users.schema';
import { users } from '@db/schema/users';
import { eq } from 'drizzle-orm';

/**
 * Users service — orchestrates business logic.
 * Calls repository for DB access, applies domain rules, returns plain objects.
 */

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) throw new NotFoundError('User');
  return {id:user.id,name:user.name,email:user.email}
}

export async function updateProfile(
  userId: string,
  dto: UpdateProfileDto,
): Promise<PublicUser> {
  const updated = await updateUserById(userId, dto);
  return {id:updated.id,name:updated.name,email:updated.email};
}

export async function deleteUser(
  userId: string,
): Promise<void> {
  const user = await findUserById(userId);

  if (!user) {
    throw new NotFoundError('User');
  }

  await deleteUserById(userId);
}

// export function toPublicUser(user: import('@db/schema').User): PublicUser {
//   return {
//     id: user.id,
//     name: user.name,
//     email: user.email,
//   };
// }