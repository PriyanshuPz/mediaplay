import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";

export function MediaViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: media,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["media", id],
    queryFn: () => api.getMediaById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error || !media) {
    return <ErrorMessage message={error?.message || "Media not found"} />;
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const formatSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const renderMedia = () => {
    if (media.type === "image") {
      return (
        <div className="bg-black rounded-lg overflow-hidden">
          <img
            src={media.path}
            alt={media.title}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        </div>
      );
    }

    // For video, movie, or series
    return (
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          controls
          className="w-full h-auto max-h-[70vh]"
          poster={media.poster_path}
        >
          <source
            src={`/api/media/${id}/stream`}
            type={media.mime || "video/mp4"}
          />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate("/")}
        className="mb-8 flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        <span>Back to Library</span>
      </button>

      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        {/* Media Player/Viewer */}
        <div className="p-6 bg-black rounded-t-lg">{renderMedia()}</div>

        {/* Media Details */}
        <div className="border-t border-gray-100 p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-950 mb-3">
                {media.title}
              </h1>
              <div className="flex items-center space-x-3 text-sm">
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded font-medium capitalize">
                  {media.type}
                </span>
                {media.year && (
                  <span className="text-gray-500 font-medium">
                    {media.year}
                  </span>
                )}
                {media.duration && (
                  <span className="text-gray-500 font-medium">
                    {formatDuration(media.duration)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {media.description && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Description
              </h3>
              <p className="text-base text-gray-600">{media.description}</p>
            </div>
          )}

          {(media.season || media.episode) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Episode Info
              </h3>
              <p className="text-base text-gray-600">
                Season {media.season}, Episode {media.episode}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">
                File Size
              </div>
              <div className="text-base font-semibold text-gray-900">
                {formatSize(media.size)}
              </div>
            </div>
            {media.mime && (
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1.5">
                  Format
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {media.mime}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">
                File Name
              </div>
              <div className="text-base font-semibold text-gray-900 truncate">
                {media.name}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 mb-1.5">
                Added
              </div>
              <div className="text-base font-semibold text-gray-900">
                {new Date(media.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
