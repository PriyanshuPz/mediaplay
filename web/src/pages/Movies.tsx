import { CollectionPage } from "./CollectionPage";

export function Movies() {
  return (
    <CollectionPage
      type="movie"
      title="Movies"
      description="Recently indexed movie entries with their current metadata."
    />
  );
}
