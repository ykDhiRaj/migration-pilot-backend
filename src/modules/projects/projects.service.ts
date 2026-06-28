import { NotFoundError } from "@core/errors";
import { createProjectForUser, deleteProjectById, findProjectsByUserId, updateProjectNameByUserId } from "./projects.repository";
import { CreateProjectDto } from "./projects.schema";

export async function getProjectsForUser(userId:string){
    const projects = await findProjectsByUserId(userId);
    if(!projects) throw new NotFoundError('Projects');
    return projects;
}

export async function updateProjectNameForUser(
    userId: string,
    projectId: string,
    name: string,
) {
    const project = await updateProjectNameByUserId(projectId, userId, name);

    if (!project) throw new NotFoundError('Project');

    return project;
}

export async function createProjectForAuthenticatedUser(
    userId: string,
    dto: CreateProjectDto,
) {
    return createProjectForUser(dto, userId);
}

export async function deleteProjectForUser(
    projectId:string
){
    return deleteProjectById(projectId)
}