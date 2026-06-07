import { eq } from 'drizzle-orm';
import { getDb, type Db } from '@core/db';
import { emailVerifications, User, users } from '@db/schema';
import { NotFoundError } from '@core/errors';

export type { User } from '@db/schema';
export type PublicUser  = Pick<User, 'id' | 'name' | 'email'>;

export async function findUserById(
  id: string,
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

export async function findRegisteringUserByEmail(
  email:string,
  db: Db = getDb(),
):Promise<import('@db/schema').EmailVerification>{
  const result = await db.select().from(emailVerifications).where(eq(emailVerifications.email, email)).limit(1);
  return result[0] ?? null;
}

export async function createUser(
  data: {
    email: string;
    authProvider: 'LOCAL' | 'GOOGLE';
    name?: string;
    isEmailVerified?:boolean
  },
  db: Db = getDb(),
) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

export async function createNewRegisterUser(
  data:{
  email:string,
  otp:string,
  expiresAt:Date
},
db: Db = getDb()){
  const result = await db.insert(emailVerifications).values(data).returning();
  return result[0];
}

export async function updateEmailVerificationByEmail(
  email:string,
  data:Partial<{
    otp:string;
    expiresAt:Date;
  }>,
  db: Db = getDb(),
):Promise<import('@db/schema').EmailVerification>{
  const result = await db.update(emailVerifications).set(data).where(eq(emailVerifications.email, email)).returning();
  if(!result[0]) throw new NotFoundError('Email Verification');
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
  id: string,
  data: Partial<{ name: string;}>,
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

export async function deleteUserById(
  id:string,
  db: Db = getDb(),
):Promise<void>{
  const result = await db.delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id });

  if (result.length === 0) throw new NotFoundError('User');
}

export async function deleteEmailVerificationByEmail(
  email: string,
  db: Db = getDb(),
): Promise<void> {
  await db.delete(emailVerifications).where(eq(emailVerifications.email, email));
}

// export function stripPassword(user: import('@db/schema').User): PublicUser {
//   const { password: _omit, ...rest } = user;
//   return rest;
// }
