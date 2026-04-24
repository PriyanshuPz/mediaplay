import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { MediaShelf } from "../components/MediaShelf";

export function ManageMedia() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["media", "all"],
    queryFn: api.fetchMedia,
  });

  return (
    <div className="space-y-4">
      <section className="border border-zinc-200 bg-white px-4 py-3">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Library
          </div>
          <h1 className="text-lg font-medium text-zinc-900">
            Browse everything in one place
          </h1>
          <p className="text-sm text-zinc-500">
            Open any item to edit metadata or replace thumbnails.
          </p>
        </div>
      </section>

      {error ? <ErrorMessage message={error.message} /> : null}
      {isLoading ? <LoadingSpinner /> : null}
      {data ? (
        <MediaShelf
          title="All media"
          description="Every item in the catalog, sorted by newest first."
          items={data}
          emptyText="No media has been indexed yet."
        />
      ) : null}
    </div>
  );
}
