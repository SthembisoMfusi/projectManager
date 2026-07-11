import UserController from "../controllers/user.controller.js";

const userProperties = {
    name: { type: "string" },
    email: { type: "string" },
    password: { type: "string" , minLength: 8 },
    isActive: { type: "boolean" }
}

const getAllUsersSchema = { tags: ['Users'], summary: 'Get all users' };
const getUserByIdSchema = { tags: ['Users'], summary: 'Get a user by ID' };
const deleteUserSchema = { tags: ['Users'], summary: 'Delete a user' };

const createUserSchema = {
    tags: ['Users'],
    summary: 'Create a new user',
    body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: userProperties
    }
};

const updateUserSchema = {
    tags: ['Users'],
    summary: 'Update a user',
    body: {
        type: 'object',
        properties: userProperties
    }
};


export default async function userRoutes(fastify, options) {
    fastify.get('/', { schema: getAllUsersSchema }, UserController.getAllUsers);
    fastify.get('/:id', { schema: getUserByIdSchema }, UserController.getUserById);
    fastify.post('/', { schema: createUserSchema }, UserController.createUser);
    fastify.put('/:id', { schema: updateUserSchema }, UserController.updateUser);
    fastify.delete('/:id', { schema: deleteUserSchema }, UserController.deleteUser);
}