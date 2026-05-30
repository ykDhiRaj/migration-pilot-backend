import { NotFoundError } from '@core/errors';
import {
  findUserById,
  updateUserById,
  stripPassword,
  PublicUser,
} from './users.repository';
import { UpdateProfileDto } from './users.schema';

/**
 * Users service — orchestrates business logic.
 * Calls repository for DB access, applies domain rules, returns plain objects.
 */

export async function getProfile(userId: number): Promise<PublicUser> {
  const user = await findUserById(userId);
  if (!user) throw new NotFoundError('User');
  return stripPassword(user);
}

export async function updateProfile(
  userId: number,
  dto: UpdateProfileDto,
): Promise<PublicUser> {
  const updated = await updateUserById(userId, dto);
  return stripPassword(updated);
}
