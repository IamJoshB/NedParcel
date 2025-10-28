import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Express } from "express";

const swaggerDocs = (app: Express): void => {
  const apiTitle: string = "NedParcel";

  const options: swaggerJsdoc.Options = {
    definition: {
      openapi: "3.0.1",
      info: {
        title: apiTitle,
        version: "1.0.0",
      },
      servers: [
        {
          url: `https://nedparcel-production.up.railway.app`,
        },
      ],
      components: {
        schemas: {
          EmptyObject: {
            type: "object",
          },
        },
        securitySchemes: {
          no_auth: {
            scheme: "Bearer",
            type: "http",
          },
        },
      },
    },
    apis: ["src/controllers/*.ts", "dist/controllers/*.js"],
  };

  const swaggerSpec = swaggerJsdoc(options);
  app.use(
    `/${apiTitle.toLowerCase()}/swagger`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
  );
};

export default swaggerDocs;
