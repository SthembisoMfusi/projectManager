import dotenv from "dotenv";
import { cleanData } from "../utils/utils.js";
dotenv.config();
const projectsEndpoint = 'node/project';
const DRUPAL_API_URL = process.env.DRUPAL_API_URL + projectsEndpoint;
async function getAllProjects(request,reply){
    try {
        const fetchUrl = `${DRUPAL_API_URL}?include=field_manager,field_team_members`;
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            throw new Error(`Drupal responded with status ${response.status}`);
        }
        const rawData = await response.json();

        const cleanProjects = rawData.data.map(item => {
            return cleanData(item, rawData.included);
        });
        return {
            projects: cleanProjects
        };
    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function getProjectById(request,reply){
    try {
        const { id } = request.params;
        const response = await fetch(`${DRUPAL_API_URL}/${id}?inlcude=field_manager,field_team_members`);
        if (response.status === 404){
            return reply.code(404).send({ error: "Project not found" });
        }
        if (!response.ok) {
            throw new Error(`Drupal responded with status ${response.status}`);
        }
        const rawData = await response.json();
        const cleanProject = cleanData(rawData.data, rawData.included);
        return {
            project: cleanProject
        };
    } catch (error) {
        if (error.message === "Project not found"){
            return reply.code(404).send({ error: error.message });
        } else {
            return reply.code(500).send({ error: error.message });
        }

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
            headers: {
                "Content-Type": "application/vnd.api+json",
                "Accept": "application/vnd.api+json"
            },
            body: JSON.stringify(drupalPayload)
        });

        if (!response.ok) {
            const errorText = await response.text(); 
            throw new Error(`Drupal error ${response.status}`);
        }

     
        const rawData = await response.json();
      
        const cleanProject = cleanData(rawData.data, rawData.included || []); 
        return reply.code(201).send({ project: cleanProject });

    } catch (error) {
        console.error("FATAL CRASH IN CONTROLLER:", error);
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
            attributes.body = {
                value: description,
                format: "plain_text"
            };
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
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            },
            body: JSON.stringify(drupalPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Drupal Error:", JSON.stringify(errorData, null, 2));
            throw new Error(`Drupal responded with status ${response.status}`);
        }

        const rawData = await response.json();
        
        return { 
            project: cleanData(rawData.data, rawData.included || []) 
        };

    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}


async function deleteProject(request, reply) {
    try {
        const { id } = request.params;
        const response = await fetch(`${DRUPAL_API_URL}/${id}`,{
            method: 'DELETE',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        if (response.status === 404){
            return reply.code(404).send({ error: "Project not found" });
        }

        if (!response.ok) {
            throw new Error(`Drupal responded with status ${response.status}`);
        }

        return reply.code(200).send({
            message: "Project deleted successfully",
            deletedId: id
        }); 
    } catch (error) { 
        return reply.code(500).send({
            error: error.message
        });
    }
}

export default {
    getAllProjects,
    getProjectById,
    createProject,
    updateProject,
    deleteProject
};
