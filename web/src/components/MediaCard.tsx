import { Link } from "react-router-dom";
import type { Media } from "../lib/types";
import { FaCircle, FaPlay } from "react-icons/fa6";
import { resolveAssetUrl } from "../lib/utls";

interface MediaCardProps {
  media: Media;
}

export function MediaCard({ media }: MediaCardProps) {
  const thumbnail = resolveAssetUrl(media.thumbnail);

  return (
    <Link to={`/media/${media.id}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-all duration-300 hover:scale-[1.02] hover:border-primary/40">
        <div className="relative aspect-2/3 w-full overflow-hidden bg-muted">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={media.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-xs tracking-widest">MP</span>
            </div>
          )}

          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/70 px-2 py-0.5 text-[10px] uppercase text-foreground backdrop-blur">
            <FaCircle className="h-2 w-2 text-primary" />
            {media.type}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-background/90 via-transparent to-transparent opacity-80" />

          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-hover:bg-black/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
              <FaPlay className="ml-0.5 h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between p-2">
          <h3 className="line-clamp-2 min-h-10 text-sm font-medium leading-tight text-foreground">
            {media.title}
          </h3>

          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
              <span className="flex items-center gap-1">
                <FaPlay className="h-2.5 w-2.5" />
                open
              </span>
            </div>

            {(media.series || media.season || media.episode) && (
              <div className="flex flex-wrap gap-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                {media.series?.title && <span>{media.series.title}</span>}
                {media.season?.number && <span>S{media.season.number}</span>}
                {media.episode?.number && <span>E{media.episode.number}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
