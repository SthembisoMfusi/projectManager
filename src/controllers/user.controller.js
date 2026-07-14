import dotenv from 'dotenv';
import { cleanData, cleanUser } from '../utils/utils.js';

dotenv.config();

const DRUPAL_BASE_URL = process.env.DRUPAL_BASE_URL; 
const DRUPAL_API_URL = `${DRUPAL_BASE_URL}/jsonapi/user/user`;

async function getAllUsers(request, reply) {
    try {
        const response = await fetch(DRUPAL_API_URL);
        const rawData = await response.json();

        const users = rawData.data.map(item => cleanUser(item)).filter(user => user.name !== "Anonymous");
        return { users: users };
    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function getUserById(request, reply) {
    try {
        const { id } = request.params;
        const response = await fetch(`${DRUPAL_API_URL}/${id}`);
        const rawData = await response.json();
        const user = cleanUser(rawData.data);
        return { user: user };
    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function createUser(request, reply) {
    try {
        const { name, email, password } = request.body;
        
        const drupalPayload = {
            data: {
                type: "user--user",
                attributes: {
                    name: name,
                    mail: email,
                    pass: password
                }
            }
        };

        const response = await fetch(DRUPAL_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/vnd.api+json",
                "Accept": "application/vnd.api+json"
            },
            body: JSON.stringify(drupalPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("DRUPAL REJECTED REGISTRATION:", errorText);
            throw new Error(`Drupal responded with status ${response.status}`);
        }

        const rawData = await response.json();
        return reply.code(201).send({ user: cleanUser(rawData.data) });

    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function updateUser(request, reply) {
    try {
        const { id } = request.params;
        const { name, email, password, isActive } = request.body;

        const attributes = {};
        if (name) attributes.name = name;
        if (email) attributes.mail = email;
        if (password) attributes.pass = password;
        if (isActive !== undefined) attributes.status = isActive;

        const drupalPayload = {
            data: {
                type: "user--user",
                id: id,
                attributes: attributes
            }
        };
        const response = await fetch(`${DRUPAL_API_URL}/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/vnd.api+json",
                "Accept": "application/vnd.api+json"
            },
            body: JSON.stringify(drupalPayload)
        });
        if (!response.ok) {
            const errData = await response.json();
            console.error("Drupal Error", JSON.stringify(errData, null, 2));
            throw new Error(`Drupal responded with status ${response.status}`);
        }
        const rawData = await response.json();
        const user = cleanUser(rawData.data);
        return { user: user };
    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

async function deleteUser(request, reply) {
    try {
        const { id } = request.params;
        const response = await fetch(`${DRUPAL_API_URL}/${id}`, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json'
            }
        });

        if (response.status === 404) {
            return reply.code(404).send({ error: "User not found" });
        }
        if (!response.ok) {
            throw new Error(`Drupal responded with status ${response.status}`);
        }
        return reply.code(200).send({
            message: "User deleted successfully",
            deletedId: id
        });
    } catch (error) {
        if (error.message === "User not found") {
            return reply.code(404).send({ error: error.message });
        } else {
            return reply.code(500).send({ error: error.message });
        }
    }
}

async function loginUser(request, reply) {
    try {
        const { username, password } = request.body;

        const response = await fetch(`${DRUPAL_BASE_URL}/user/login?_format=json`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: username,
                pass: password
            })
        });

        if (!response.ok) {
            return reply.code(401).send({ error: "Invalid credentials" });
        }

        const data = await response.json();

        return reply.code(200).send({
            message: "Login successful",
            token: data.access_token,
            user: {
                name: data.current_user.name,
                uid: data.current_user.uid
            }
        });
    } catch (error) {
        return reply.code(500).send({ error: error.message });
    }
}

export default {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    loginUser
};