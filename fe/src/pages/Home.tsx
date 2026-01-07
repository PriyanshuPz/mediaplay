import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { MediaCard } from "../components/MediaCard";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";

export function Home() {
  const {
    data: mediaList,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["media"],
    queryFn: api.fetchMedia,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold text-gray-950 mb-2">
            My Media Library
          </h1>
          <p className="text-base text-gray-500">
            Browse your personal collection
          </p>
        </div>
        <div className="text-xs font-medium text-gray-400">
          {mediaList?.length || 0} {mediaList?.length === 1 ? "item" : "items"}
        </div>
      </div>

      {!mediaList || mediaList.length === 0 ? (
        <div className="text-center py-24">
          <svg
            className="w-16 h-16 mx-auto text-gray-200 mb-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="text-base font-medium text-gray-500 mb-1">
            No media yet
          </h3>
          <p className="text-sm text-gray-400">
            Start by adding your first media item
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mediaList.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      )}
    </div>
  );
}
