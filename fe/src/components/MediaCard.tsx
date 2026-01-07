import { Link } from "react-router-dom";
import type { Media } from "../lib/api";

interface MediaCardProps {
  media: Media;
}

export function MediaCard({ media }: MediaCardProps) {
  const getTypeIcon = () => {
    switch (media.type) {
      case "image":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "video":
      case "movie":
      case "series":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <Link
      to={`/media/${media.id}`}
      className="group block bg-white border border-gray-100 rounded-lg overflow-hidden hover:border-gray-200 hover:shadow-sm transition-all"
    >
      <div className="relative aspect-video bg-gray-50 flex items-center justify-center">
        {media.poster_path ? (
          <img
            src={media.poster_path}
            alt={media.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-gray-300 text-5xl">{getTypeIcon()}</div>
        )}
        <div className="absolute top-2 right-2 bg-white bg-opacity-90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 shadow-sm">
          {getTypeIcon()}
          <span className="capitalize">{media.type}</span>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {media.title}
        </h3>

        {media.description && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2">
            {media.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            {media.year && <span>{media.year}</span>}
            {media.duration && <span>• {formatDuration(media.duration)}</span>}
          </div>
          <span>{formatSize(media.size)}</span>
        </div>

        {(media.season || media.episode) && (
          <div className="mt-2 text-xs text-blue-600 font-medium">
            S{media.season} E{media.episode}
          </div>
        )}
      </div>
    </Link>
  );
}
