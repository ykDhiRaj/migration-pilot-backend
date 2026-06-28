import { z } from 'zod';

export const dCreateProjectSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(5000).optional(),
	databaseType: z.enum(['MYSQL', 'POSTGRESQL']),
});

export const ProjectIdParamSchema = z.object({
	projectId: z.string().uuid(),
});

export const UpdateProjectNameSchema = z.object({
	name: z.string().min(1).max(255),
});

export type CreateProjectDto = z.infer<typeof dCreateProjectSchema>;
export type ProjectIdParamDto = z.infer<typeof ProjectIdParamSchema>;
export type UpdateProjectNameDto = z.infer<typeof UpdateProjectNameSchema>;
