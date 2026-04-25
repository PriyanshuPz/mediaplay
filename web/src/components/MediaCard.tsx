import { Link } from "react-router-dom";
import { API_ORIGIN } from "../lib/api";
import type { Media } from "../lib/types";
import { FaCircle, FaPlay } from "react-icons/fa6";

interface MediaCardProps {
  media: Media;
}

export function MediaCard({ media }: MediaCardProps) {
  const thumbnail = resolveAssetUrl(media.thumbnail);
  const label =
    media.series?.title || media.file_path.split("/").pop() || media.file_path;

  return (
    <Link
      to={`/media/${media.id}`}
      className="group relative block overflow-hidden border border-zinc-200 bg-zinc-900 rounded-lg transition-all duration-300 hover:shadow-2xl hover:border-zinc-400 active:scale-95"
    >
      <div className="relative aspect-2/3 w-full overflow-hidden bg-zinc-800">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={media.title}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            <span className="text-xs font-semibold tracking-[0.35em]">MP</span>
          </div>
        )}

        <div className="absolute left-2 top-2 inline-flex items-center gap-1 border border-zinc-200/40 bg-zinc-950/70 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-100 transition-all duration-300 group-hover:bg-zinc-950/90 group-hover:border-zinc-200">
          <FaCircle className="h-2 w-2" />
          {media.type}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-zinc-950/90 via-zinc-950/10 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:bg-black/40">
          <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform transition-transform duration-300 group-hover:scale-110">
            <FaPlay className="h-6 w-6 text-zinc-900 ml-1" />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 space-y-1 px-2.5 pb-2.5 pt-6 transition-all duration-300">
          <h3 className="line-clamp-2 text-sm font-medium leading-5 text-zinc-100 group-hover:text-white transition-colors">
            {media.title}
          </h3>

          <div className="flex items-center justify-between gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
            <span className="truncate text-[11px] text-zinc-300">{label}</span>
            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] text-zinc-200 group-hover:text-blue-400 transition-colors">
              <FaPlay className="h-2.5 w-2.5" />
              open
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.15em] text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {media.series?.title ? <span>{media.series.title}</span> : null}
            {media.season?.number ? <span>S{media.season.number}</span> : null}
            {media.episode?.number ? (
              <span>E{media.episode.number}</span>
            ) : null}
          </div>
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
