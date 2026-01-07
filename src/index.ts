import "dotenv/config";
import { serveStatic } from "@hono/node-server/serve-static";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import mediaRoutes from "./routes/media/route.js";
import { migrate } from "./db/migrate.js";

// migrate db schema
migrate();

const app = new Hono();
const port = parseInt(process.env.PORT || "80");

app.use("/*", serveStatic({ root: "./dist/fe" }));

app.route("/api", mediaRoutes);

app.get("/health", (c) => {
  return c.text("Hello Hono!");
});

app.get("*", serveStatic({ path: "./dist/fe/index.html" }));

serve({ fetch: app.fetch, port: port }, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`);
});
