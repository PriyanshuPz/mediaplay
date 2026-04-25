import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { MediaType } from "../lib/types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { MediaCard } from "../components/MediaCard";

interface CollectionPageProps {
  type: MediaType;
  title: string;
  description: string;
}

export function CollectionPage({
  type,
  title,
  description,
}: CollectionPageProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["media", type],
    queryFn: () => api.listMedia(type),
  });

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card px-4 py-4">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Collection
          </div>
          <h1 className="text-lg font-semibold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </section>

      {error && <ErrorMessage message={error.message} />}
      {isLoading && <LoadingSpinner />}

      {data && data.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {data.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      )}

      {/* Empty */}
      {data && data.length === 0 && (
        <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
          No {title.toLowerCase()} found.
        </div>
      )}
    </div>
  );
}
