import dotenv from "dotenv";
import { cleanData } from "../utils/utils.js";
dotenv.config();

const DRUPAL_API_URL = process.env.DRUPAL_API_URL;
async function getAllProjects(request,reply){
    try {
        const response = await fetch(DRUPAL_API_URL);
        if (!response.ok) {
            throw new Error(`Drupal responded with status ${response.status}`);
        }
        const rawData = await response.json();
        const cleanProjects = rawData.data.map(item => {
            return cleanData(item);
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
        const response = await fetch(`${DRUPAL_API_URL}/${id}`);
        if (response.status === 404){
            return reply.code(404).send({ error: "Project not found" });
        }
        if (!response.ok) {
            throw new Error(`Drupal responded with status ${response.status}`);
        }
        const rawData = await response.json();
        const cleanProject = cleanData(rawData.data);
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

async function createProject(request,reply){
    try {
        const { title, description, status } = request.body;
        const drupalPayload = {
            data: {
                type: "node--project",
                attributes: {
                    title: title,
                    body: {
                        value: description,
                        format: "plain_text"
                    },
                    field_status: status || "not_started"
                }
            }
        }
        const response = await fetch(DRUPAL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/vnd.api+json",
                "Accept": "application/vnd.api+json"
            },
            body: JSON.stringify(drupalPayload)
        });
        if (!response.ok) {
            throw new Error(`Drupal responded with status ${response.status}`);
        }
        const rawData = await response.json();
        const cleanProject = cleanData(rawData.data);
        return {
            project: cleanProject
        };
    } catch (error) {
        return reply.code(500).send({
            error: error.message
        })
    }
}

async function updateProject(request, reply) {
    try {
        const { id } = request.params;
        const { title, description, status } = request.body;

      
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

       
        const response = await fetch(`${DRUPAL_API_URL}/${id}`, {
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
            project: cleanData(rawData.data) 
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
