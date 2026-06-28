import { requireAuth } from "@shared/middleware";
import { AppRequest } from "@shared/types";
import { Router } from "express";
import { validate } from "@shared/middleware";
import { createProjectForAuthenticatedUser, deleteProjectForUser, getProjectsForUser, updateProjectNameForUser } from "./projects.service";
import { dCreateProjectSchema, ProjectIdParamSchema, UpdateProjectNameSchema } from "./projects.schema";
import { ok } from "@core/http/respond";


export const projectsRouter = Router()

projectsRouter.get('/',requireAuth, async (req, res, next) => {
    try {
        const userId = (req as AppRequest).ctx.userId!;
        const projects = await getProjectsForUser(userId);
        ok(res, { projects });
    }catch(err){
        next(err);
    }
});

projectsRouter.post(
    '/',
    requireAuth,
    validate(dCreateProjectSchema),
    async (req, res, next) => {
        try {
            const request = req as AppRequest<
                import('./projects.schema').CreateProjectDto,
                Record<string, string>,
                Record<string, string>
            >;
            const userId = request.ctx.userId!;
            const project = await createProjectForAuthenticatedUser(userId, request.body);

            ok(res, { project }, 201);
        } catch (err) {
            next(err);
        }
    },
);

projectsRouter.patch(
    '/:projectId',
    requireAuth,
    validate(ProjectIdParamSchema, 'params'),
    validate(UpdateProjectNameSchema),
    async (req, res, next) => {
        try {
            const request = req as AppRequest<{ name: string }, Record<string, string>, { projectId: string }>;
            const userId = request.ctx.userId!;
            const { projectId } = request.params;
            const { name } = request.body;

            const project = await updateProjectNameForUser(userId, projectId, name);

            ok(res, { project });
        } catch (err) {
            next(err);
        }
    },
);

projectsRouter.delete('/:projectId', requireAuth, validate(ProjectIdParamSchema, 'params'), async (req, res, next) => {
    try {
        const request = req as AppRequest<Record<string, string>, Record<string, string>, { projectId: string }>;
        const { projectId } = request.params;
        await deleteProjectForUser(projectId);
        ok(res, { message: 'Project deleted successfully' });
    } catch (err) {
        next(err);
    }
});