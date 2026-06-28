import { Db, getDb } from "@core/db";
import { NewProject, projects } from "@db/schema/projects";
import { NotFoundError } from "@core/errors";
import { and, eq } from "drizzle-orm";

export async function findProjectsByUserId(id:string, db: Db = getDb()): Promise<import('@db/schema').Project[] | null>{
    const result = await db.select().from(projects).where(eq(projects.userId, id));
    return result ?? null;
}

export async function updateProjectNameByUserId(
    projectId: string,
    userId: string,
    name: string,
    db: Db = getDb(),
): Promise<import('@db/schema').Project | null> {
    const result = await db
        .update(projects)
        .set({
            name,
            updatedAt: new Date(),
        })
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
        .returning();

    return result[0] ?? null;
}

export async function createProjectForUser(
    data: Omit<NewProject, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    userId: string,
    db: Db = getDb(),
): Promise<import('@db/schema').Project> {
    const result = await db
        .insert(projects)
        .values({
            ...data,
            userId,
        })
        .returning();

    return result[0];
}

export async function deleteProjectById(
    id:string,
    db: Db = getDb(),
):Promise<void>{
    const result = await db
        .delete(projects)
        .where(eq(projects.id, id))
        .returning({ id: projects.id });

    if(result.length === 0) throw new NotFoundError('Project');
}