import ProjectController from "../controllers/project.controller.js";

const projectProperties = {
    title: { type: 'string' },
    description: { type: 'string' },
    status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] },
    managerId: { type: 'string' },
    teamMemberIds: { type: 'array', items: { type: 'string' } }
};

const getAllProjectsSchema = { tags: ['Projects'], summary: 'Get all projects' };
const getProjectByIdSchema = { tags: ['Projects'], summary: 'Get a project by ID' };
const deleteProjectSchema = { tags: ['Projects'], summary: 'Delete a project' };

const createProjectSchema = {
    tags: ['Projects'],
    summary: 'Create a new project',
    body: {
        type: 'object',
        required: ['title', 'description'],
        properties: projectProperties
    }
};

const updateProjectSchema = {
    tags: ['Projects'],
    summary: 'Update a project',
    body: {
        type: 'object',
        properties: projectProperties
    }
};

export default async function projectRoutes(fastify, options) {
    fastify.get('/api/projects', { schema: getAllProjectsSchema }, ProjectController.getAllProjects);
    fastify.get('/api/projects/:id', { schema: getProjectByIdSchema }, ProjectController.getProjectById);
    fastify.post('/api/projects', { schema: createProjectSchema }, ProjectController.createProject);
    fastify.put('/api/projects/:id', { schema: updateProjectSchema }, ProjectController.updateProject);
    fastify.delete('/api/projects/:id', { schema: deleteProjectSchema }, ProjectController.deleteProject);
}