import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { MediaType } from "../lib/types";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { MediaShelf } from "../components/MediaShelf";

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
    <div className="space-y-4">
      <section className="border border-zinc-200 bg-white px-4 py-3">
        <div className="space-y-1">
          <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            Collection
          </div>
          <h1 className="text-lg font-medium text-zinc-900">{title}</h1>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
      </section>

      {error ? <ErrorMessage message={error.message} /> : null}
      {isLoading ? <LoadingSpinner /> : null}
      {data ? (
        <MediaShelf
          title={title}
          description={description}
          items={data}
          emptyText={`No ${title.toLowerCase()} have been indexed yet.`}
        />
      ) : null}
    </div>
  );
}
