import { Link } from "react-router-dom";
import { API_ORIGIN } from "../lib/api";
import type { Media } from "../lib/types";
import { FaCircle, FaPen } from "react-icons/fa6";

interface MediaCardProps {
  media: Media;
}

export function MediaCard({ media }: MediaCardProps) {
  const thumbnail = resolveAssetUrl(media.thumbnail);
  const label = media.series?.title || media.file_path;

  return (
    <Link
      to={`/media/${media.id}`}
      className="group block border-b border-zinc-200 bg-white transition-colors hover:bg-zinc-50"
    >
      <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 px-3 py-3 sm:grid-cols-[120px_minmax(0,1fr)]">
        <div className="relative h-16 w-full overflow-hidden border border-zinc-200 bg-zinc-100 sm:h-20">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={media.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-400">
              <span className="text-xs font-semibold tracking-[0.35em]">
                MP
              </span>
            </div>
          )}
          <div className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
            <FaCircle className="h-2 w-2" />
            {media.type}
          </div>
        </div>

        <div className="min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-sm font-medium text-zinc-900">
              {media.title}
            </h3>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
              <FaPen className="h-2.5 w-2.5" />
              edit
            </span>
          </div>

          {media.description ? (
            <p className="line-clamp-1 text-xs text-zinc-500">
              {media.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
            {media.series?.title ? <span>{media.series.title}</span> : null}
            {media.season?.number ? (
              <span>Season {media.season.number}</span>
            ) : null}
            {media.episode?.number ? (
              <span>Episode {media.episode.number}</span>
            ) : null}
          </div>

          <p className="truncate text-[11px] text-zinc-400">{label}</p>
        </div>
      </div>
    </Link>
  );
}

function resolveAssetUrl(path?: string) {
  if (!path) {
    return "";
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${API_ORIGIN}${path}`;
  }

  return `${API_ORIGIN}/${path}`;
}
