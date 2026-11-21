import { notFound } from "next/navigation";
import { MediaDetailView } from "@/features/media/components/media-detail";

export const revalidate = 3600;

type MediaPageProps = {
  params: Promise<{ mediaType: string; tmdbId: string }>;
  searchParams: Promise<{ season?: string }>;
};

export default async function MediaPage({
  params,
  searchParams,
}: MediaPageProps) {
  const { mediaType, tmdbId: rawId } = await params;
  const { season } = await searchParams;
  const tmdbId = Number(rawId);
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) notFound();

  return (
    <MediaDetailView
      mediaType={mediaType}
      tmdbId={tmdbId}
      season={season}
      backHref="/collections"
      backLabel="Back to collections"
    />
  );
}
