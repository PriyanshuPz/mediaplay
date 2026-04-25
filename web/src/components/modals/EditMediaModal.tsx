import { useState } from "react";
import { MetadataSearchPanel } from "../MetadataSearchPanel";
import type { EditingMedia } from "../../pages/AdminPage";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type EditMediaModalProps = {
  media: EditingMedia;
  onSave: (data: EditingMedia) => void;
  onCancel: () => void;
  isLoading: boolean;
};

export function EditMediaModal({
  media,
  onSave,
  onCancel,
  isLoading,
}: EditMediaModalProps) {
  const [title, setTitle] = useState(media.title);
  const [description, setDescription] = useState(media.description);
  const [seriesName, setSeriesName] = useState(media.seriesName || "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="flex h-[90vh] w-full max-w-5xl flex-col rounded-lg border bg-card">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-foreground">Edit Media</h2>
          <p className="text-sm text-muted-foreground">
            Update metadata or apply suggestions.
          </p>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid h-full gap-6 overflow-y-auto p-6 md:grid-cols-2">
            <div className="space-y-4">
              <Input label="Title" value={title} onChange={setTitle} />
              <Textarea
                label="Description"
                value={description}
                onChange={setDescription}
              />
              <Input
                label="Series"
                value={seriesName}
                onChange={setSeriesName}
              />
            </div>

            <div className="overflow-y-auto">
              <MetadataSearchPanel
                mediaId={media.id.toString()}
                defaultQuery={media.title}
                title="Search metadata"
                description="Select to autofill"
                onSelect={(c) => {
                  setTitle(c.title || title);
                  setDescription(c.overview || description);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t p-4">
          <button
            onClick={onCancel}
            className="px-3 py-2 text-sm text-muted-foreground"
          >
            Cancel
          </button>

          <button
            onClick={() =>
              onSave({
                id: media.id,
                title,
                description,
                seriesName,
                type: media.type,
              })
            }
            className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
          >
            {isLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
