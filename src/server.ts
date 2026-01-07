import "dotenv/config";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
const port = process.env.PORT || 80;

const app = new Hono();

app.use("/*", serveStatic({ root: "./dist" }));

export default {
  fetch: app.fetch,
  port,
};
