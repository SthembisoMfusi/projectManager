import Fastify from "fastify";
import projectRoutes from "./routes/project.routes.js";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import cors from "@fastify/cors";  



const fastify = Fastify({
    logger: true
});

fastify.register(cors, {
    origin: "*",
})

fastify.register(swagger, {
    openapi: {
        info: {
            title: "Project Manager API",
            description: "API for managing projects via Headless Drupal",
            version: "1.0.0"
        }
    }
});

fastify.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
        docExpansion: "full",
        deepLinking: false
    }
});
fastify.register(projectRoutes, { prefix: '/api/projects' });

const start = async () => {
    try { 
        await fastify.listen({ port: 3000 });
        
        console.log("Server running on port 3000");
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
}

start();