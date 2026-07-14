import dotenv from 'dotenv';
import { cleanData } from '../utils/utils.js';

dotenv.config();

const DRUPAL_BASE_URL = process.env.DRUPAL_BASE_URL;
const DRUPAL_API_URL = `${DRUPAL_BASE_URL}/jsonapi/node/project`;

const getAuthHeaders = (request) => {
    const headers = {
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json'
    };
    if (request.headers.authorization) {
        headers['Authorization'] = request.headers.authorization;
    }
    return headers;
};

async function getAllProjects(request, reply) {
    try {
        const response = await fetch(`${DRUPAL_API_URL}?include=field_manager,field_team_members`, {
            method: 'GET',
            headers: getAuthHeaders(request)
        });
        if (!response.ok) throw new Error(`Drupal responded with status ${response.status}`);
        
        const rawData = await response.json();
        const cleanProjects = rawData.data.map(item => cleanData(item, rawData.included || []));
        
        return { projects: cleanProjects };
    } catch (error) {
        console.error("GET ALL CRASHED:", error);
        return reply.code(500).send({ error: error.message });
    }
}

async function getProjectById(request, reply) {
    try {
        const { id } = request.params;
        const response = await fetch(`${DRUPAL_API_URL}/${id}?include=field_manager,field_team_members`, {
            method: 'GET',
            headers: getAuthHeaders(request)
        });
        
        if (response.status === 404) return reply.code(404).send({ error: "Project not found" });
        if (!response.ok) throw new Error(`Drupal responded with status ${response.status}`);
        
        const rawData = await response.json();
        return { project: cleanData(rawData.data, rawData.included || []) };
    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function createProject(request, reply) {
    try {
        const { title, description, status, managerId, teamMemberIds } = request.body;

        const drupalPayload = {
            data: {
                type: "node--project",
                attributes: {
                    title: title,
                    body: { value: description, format: "plain_text" },
                    field_status: status || "not_started"
                }
            }
        };

        if (managerId || (teamMemberIds && teamMemberIds.length > 0)) {
            drupalPayload.data.relationships = {};
            if (managerId) {
                drupalPayload.data.relationships.field_manager = {
                    data: { type: "user--user", id: managerId }
                };
            }
            if (teamMemberIds && teamMemberIds.length > 0) {
                drupalPayload.data.relationships.field_team_members = {
                    data: teamMemberIds.map(id => ({ type: "user--user", id: id }))
                };
            }
        }

        const fetchUrl = `${DRUPAL_API_URL}?include=field_manager,field_team_members`;
        const response = await fetch(fetchUrl, {
            method: "POST",
            headers: getAuthHeaders(request), 
            body: JSON.stringify(drupalPayload)
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                return reply.code(401).send({ error: "You must be logged in to create a project." });
            }
            throw new Error(`Drupal responded with status ${response.status}`);
        }

        const rawData = await response.json();
        return reply.code(201).send({ project: cleanData(rawData.data, rawData.included || []) });

    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function updateProject(request, reply) {
    try {
        const { id } = request.params;
        const { title, description, status, managerId, teamMemberIds } = request.body;

        const attributes = {};
        if (title) attributes.title = title;
        if (description) {
            attributes.body = { value: description, format: "plain_text" };
        }
        if (status) attributes.field_status = status;

        const drupalPayload = {
            data: {
                type: "node--project",
                id: id, 
                attributes: attributes
            }
        };

        if (managerId || teamMemberIds) {
            drupalPayload.data.relationships = {};
            if (managerId) {
                drupalPayload.data.relationships.field_manager = {
                    data: { type: "user--user", id: managerId }
                };
            }
            if (teamMemberIds) {
                drupalPayload.data.relationships.field_team_members = {
                    data: teamMemberIds.map(userId => ({ type: "user--user", id: userId }))
                };
            }
        }

        const fetchUrl = `${DRUPAL_API_URL}/${id}?include=field_manager,field_team_members`;
        const response = await fetch(fetchUrl, {
            method: 'PATCH', 
            headers: getAuthHeaders(request), 
            body: JSON.stringify(drupalPayload)
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                return reply.code(401).send({ error: "You are not authorized to edit this." });
            }
            throw new Error(`Drupal responded with status ${response.status}`);
        }

        const rawData = await response.json();
        return { project: cleanData(rawData.data, rawData.included || []) };

    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function deleteProject(request, reply) {
    try {
        const { id } = request.params;
        const response = await fetch(`${DRUPAL_API_URL}/${id}`,{
            method: 'DELETE',
            headers: getAuthHeaders(request) 
        });

        if (response.status === 404) return reply.code(404).send({ error: "Project not found" });
        
        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                return reply.code(401).send({ error: "You are not authorized to delete this." });
            }
            throw new Error(`Drupal responded with status ${response.status}`);
        }

        return reply.code(200).send({ message: "Project deleted successfully", deletedId: id }); 
    } catch (error) { 
        return reply.code(500).send({ error: error.message });
    }
}

export default {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};