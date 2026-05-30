import { eq } from 'drizzle-orm';
import { getDb, type Db } from '@core/db';
import { User, users } from '@db/schema';
import { NotFoundError } from '@core/errors';

export type { User } from '@db/schema';
export type PublicUser = Omit<User, 'password'>;

export async function findUserById(
  id: number,
  db: Db = getDb(),
): Promise<import('@db/schema').User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function findUserByEmail(
  email: string,
  db: Db = getDb(),
): Promise<import('@db/schema').User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function createUser(
  data: {
    email: string;
    password: string;
    authProvider: 'LOCAL' | 'GOOGLE';
  },
  db: Db = getDb(),
) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function googleCreatedUser(
  data:{
    name:string;
    email:string;
    authProvider : 'LOCAL' | 'GOOGLE';
    providerId:string;
    profileImage:string | undefined;
    isEmailVerified:boolean
  },
  db: Db = getDb(),
){
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function updateUserById(
  id: number,
  data: Partial<{ name: string; email: string }>,
  db: Db = getDb(),
): Promise<import('@db/schema').User> {
  const result = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();

  if (!result[0]) throw new NotFoundError('User');
  return result[0];
}

export function stripPassword(user: import('@db/schema').User): PublicUser {
  const { password: _omit, ...rest } = user;
  return rest;
}
