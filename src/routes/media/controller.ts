import type { Context } from "hono";
import z from "zod";
import { db } from "../../db/index.js";
import { stream } from "hono/streaming";
class MediaAPIController {
  async fetchMedia(c: Context) {
    try {
      const stmt = db.prepare(`
        SELECT 
          m.id,
          m.type,
          m.title,
          m.description,
          m.year,
          m.poster_path,
          m.created_at,
          mf.id as file_id,
          mf.path,
          mf.name,
          mf.size,
          mf.duration,
          mf.mime,
          mf.season,
          mf.episode
        FROM media m
        LEFT JOIN media_files mf ON m.id = mf.media_id
        ORDER BY m.created_at DESC
      `);

      const rows = stmt.all();

      return c.json({ success: true, data: rows });
    } catch (error) {
      return c.json({ success: false, message: "Something is wrong" }, 500);
    }
  }

  async getMediaById(c: Context) {
    try {
      const id = c.req.param("id");

      const stmt = db.prepare(`
        SELECT 
          m.id,
          m.type,
          m.title,
          m.description,
          m.year,
          m.poster_path,
          m.created_at,
          mf.id as file_id,
          mf.path,
          mf.name,
          mf.size,
          mf.duration,
          mf.mime,
          mf.season,
          mf.episode
        FROM media m
        LEFT JOIN media_files mf ON m.id = mf.media_id
        WHERE m.id = ?
      `);

      const row = stmt.get(id);

      if (!row) {
        return c.json({ success: false, message: "Media not found" }, 404);
      }

      return c.json({ success: true, data: row });
    } catch (error) {
      return c.json({ success: false, message: "Something is wrong" }, 500);
    }
  }

  async addMedia(c: Context) {
    try {
      const body = await c.req.json();

      const parsed = z
        .object({
          type: z.enum(["image", "video", "movie", "series"]),
          title: z.string().min(2),
          description: z.string(),
          year: z.number().default(2026),
          poster_path: z.string().optional(),

          path: z.string().min(2),
          size: z.number(),
          duration: z.number().optional(),
          mime: z.string().optional(),

          season: z.number().optional(),
          episode: z.number().optional(),
        })
        .safeParse(body);

      if (!parsed.success) {
        return c.json({ success: false, errors: parsed.error.flatten() }, 400);
      }

      const data = parsed.data;
      const now = Date.now();

      // wrap in a transaction (important)
      const result = db.transaction(() => {
        // 1️⃣ insert media (logical item)
        const mediaStmt = db.prepare(`
        INSERT INTO media
        (type, title, description, year, poster_path, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

        const mediaResult = mediaStmt.run(
          data.type,
          data.title,
          data.description ?? null,
          data.year ?? null,
          data.poster_path ?? null,
          now
        );

        const mediaId = mediaResult.lastInsertRowid as number;

        // 2️⃣ insert media file (actual file)
        const fileStmt = db.prepare(`
        INSERT INTO media_files
        (media_id, path, name, size, duration, mime, season, episode, indexed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

        fileStmt.run(
          mediaId,
          data.path,
          data.path.split("/").pop()!, // filename
          data.size,
          data.duration ?? null,
          data.mime ?? null,
          data.season ?? null,
          data.episode ?? null,
          now
        );

        return mediaId;
      })();

      return c.json({
        success: true,
        media_id: result,
      });
    } catch (error) {
      c.json({ success: false, message: "Something is wrong" }, 500);
    }
  }

  async streamMedia(c: Context) {
    try {
      const id = c.req.param("id");
      const stmt = db.prepare(
        `SELECT path, mime FROM media_files WHERE media_id = ? LIMIT 1`
      );
      const file = stmt.get(id) as { path: string; mime: string } | undefined;

      if (!file) {
        return c.json({ success: false, message: "Media not found" }, 404);
      }

      const fs = await import("fs");

      if (!fs.existsSync(file.path)) {
        return c.json(
          { success: false, message: "File not found on disk" },
          404
        );
      }

      const stats = fs.statSync(file.path);
      const range = c.req.header("range");

      const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
      let start = 0;
      let end = stats.size - 1;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        start = parseInt(parts[0], 10);

        if (parts[1] && parts[1].length > 0) {
          // Client specified exact end byte
          end = parseInt(parts[1], 10);
        } else {
          // Client sent open-ended range like "bytes=0-" - limit chunk size
          end = Math.min(start + CHUNK_SIZE - 1, stats.size - 1);
        }
      } else {
        // No range header - send first chunk only
        end = Math.min(CHUNK_SIZE - 1, stats.size - 1);
      }

      const chunksize = end - start + 1;

      c.header("Content-Range", `bytes ${start}-${end}/${stats.size}`);
      c.header("Accept-Ranges", "bytes");
      c.header("Content-Length", `${chunksize}`);
      c.header("Content-Type", file.mime || "video/x-matroska");
      c.status(206);

      return stream(c, async (stream) => {
        const fileStream = fs.createReadStream(file.path, { start, end });

        for await (const chunk of fileStream) {
          await stream.write(chunk);
        }
      });
    } catch (error) {
      console.error("Streaming error:", error);
      return c.json({ success: false, message: "Streaming failed" }, 500);
    }
  }
}

export const mediaAPIController = new MediaAPIController();
