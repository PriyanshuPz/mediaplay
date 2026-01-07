import { Hono } from "hono";
import { mediaAPIController } from "./controller.js";

const mediaRoutes = new Hono();

mediaRoutes.get("/media", mediaAPIController.fetchMedia);
mediaRoutes.get("/media/:id", mediaAPIController.getMediaById);
mediaRoutes.get(
  "/media/:id/stream",
  mediaAPIController.streamMedia.bind(mediaAPIController)
);

mediaRoutes.post("/media/add", mediaAPIController.addMedia);

export default mediaRoutes;
