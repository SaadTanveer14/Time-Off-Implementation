import { setupServer } from "msw/node";
import { handlers } from "./hcm/handlers";

export const server = setupServer(...handlers);
