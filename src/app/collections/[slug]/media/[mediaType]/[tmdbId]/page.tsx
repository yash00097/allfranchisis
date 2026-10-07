import { notFound } from "next/navigation";
import { MediaDetailView } from "@/components/media-detail";
import { getCollectionBySlug } from "@/lib/collections";

export const revalidate = 3600;

type CollectionMediaPageProps = {
  params: Promise<{ slug: string; mediaType: string; tmdbId: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function CollectionMediaPage({
  params,
  searchParams,
}: CollectionMediaPageProps) {
  const { slug, mediaType, tmdbId: rawId } = await params;
  const { season } = await searchParams;
  const tmdbId = Number(rawId);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) notFound();

  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <MediaDetailView
      mediaType={mediaType}
      tmdbId={tmdbId}
      season={season}
      basePath={`/collections/${collection.slug}`}
      backHref={`/collections/${collection.slug}`}
      backLabel={`Back to ${collection.name}`}
    />
  );
}
