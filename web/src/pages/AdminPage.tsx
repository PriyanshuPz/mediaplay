import { FaEdit } from "react-icons/fa";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "../lib/api";
import { EditMediaModal } from "../components/modals/EditMediaModal";
import type { MediaType, UpdateMediaInput } from "../lib/types";

export type EditingMedia = {
  id: number;
  title: string;
  description: string;
  seriesName?: string;
  type: MediaType;
};

export function AdminPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<EditingMedia | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["media", "all"],
    queryFn: api.fetchMedia,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMediaInput }) =>
      api.updateMedia(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["media", "all"] });
      await queryClient.invalidateQueries({ queryKey: ["home-feed"] });
      setEditingId(null);
      setEditingData(null);
    },
  });

  const filteredData = data?.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-lg border bg-card p-4">
        <h1 className="text-lg font-semibold text-foreground">
          Media Management
        </h1>
        <p className="text-sm text-muted-foreground">
          Edit metadata, fix titles, or remove items.
        </p>
      </section>

      <div className="rounded-lg border bg-card p-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search media..."
          className="w-full rounded-md border bg-input px-3 py-2 text-sm outline-none"
        />
      </div>

      {error && <ErrorMessage message={error.message} />}
      {isLoading && <LoadingSpinner />}

      {filteredData && filteredData.length > 0 && (
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-muted-foreground">
                  Series
                </th>
                <th className="px-4 py-3 text-right text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((media) => (
                <tr key={media.id} className="border-b hover:bg-accent">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{media.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {media.description?.substring(0, 100)}
                    </p>
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {media.type}
                  </td>

                  <td className="px-4 py-3 text-muted-foreground">
                    {media.series?.title || "-"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setEditingId(media.id);
                          setEditingData({
                            id: media.id,
                            title: media.title,
                            description: media.description,
                            seriesName: media.series?.title,
                            type: media.type,
                          });
                        }}
                        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs hover:bg-accent"
                      >
                        <FaEdit />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editingId && editingData && (
        <EditMediaModal
          media={editingData}
          onCancel={() => {
            setEditingId(null);
            setEditingData(null);
          }}
          isLoading={false}
          onSave={(updatedData) => {
            updateMutation.mutate({
              id: editingId.toString(),
              input: {
                title: updatedData.title,
                description: updatedData.description,
                seriesName: updatedData.seriesName || undefined,
              },
            });
          }}
        />
      )}
    </div>
  );
}
