import { Link } from "react-router-dom";
import type { Media } from "../lib/types";
import { MediaCard } from "./MediaCard";

interface MediaShelfProps {
  title: string;
  description?: string;
  items: Media[];
  emptyText: string;
  actionLabel?: string;
  actionTo?: string;
}

export function MediaShelf({
  title,
  description,
  items,
  emptyText,
  actionLabel,
  actionTo,
}: MediaShelfProps) {
  const featuredItems = items.slice(0, 18);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {actionLabel && actionTo && (
          <Link
            to={actionTo}
            className="hidden rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground sm:inline-flex"
          >
            {actionLabel}
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
          {featuredItems.map((media) => (
            <MediaCard key={media.id} media={media} />
          ))}
        </div>
      )}
    </section>
  );
}
