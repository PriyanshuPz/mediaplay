import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { api, getMediaStreamUrl } from "../lib/api";
import { VideoPlayer } from "../components/VideoPlayer";

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();

  const { data: media } = useQuery({
    queryKey: ["media", id],
    queryFn: () => api.getMediaById(id!),
    enabled: !!id,
  });

  if (!media) return null;

  const streamUrl = getMediaStreamUrl(media.id.toString());

  return (
    <div className="min-h-screen w-screen bg-black">
      <VideoPlayer src={streamUrl} title={media.title} />
    </div>
  );
}
