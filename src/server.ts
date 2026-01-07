import { Hono } from "hono";
import { serveStatic } from "hono/bun";

const port = Bun.env.PORT || 80;

const app = new Hono();

app.use("/*", serveStatic({ root: "./fe/dist" }));

export default {
  fetch: app.fetch,
  port,
};
