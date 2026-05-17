interface ScrapedImage {
  url: string;
  context: string;
  nearText: string;
  page: string;
}

export interface CuratedImages {
  hero: string | null;
  about: string | null;
  gallery: string[];
}

export function selectBestImages(images: ScrapedImage[]): CuratedImages {
  // Hero: first image tagged as hero, or first large background image
  const heroCandidate = images.find((img) => img.context === "hero")
    || images.find((img) => img.context === "unknown" && !img.nearText.toLowerCase().includes("logo"));

  // About: image tagged as about/team, or near "about"/"owner"/"team" text
  const aboutCandidate = images.find((img) => img.context === "about")
    || images.find((img) =>
      img.nearText.toLowerCase().match(/about|owner|team|founder|who we|meet/)
    );

  // Gallery: images tagged as gallery, or remaining work/project photos
  const usedUrls = new Set<string>();
  if (heroCandidate) usedUrls.add(heroCandidate.url);
  if (aboutCandidate) usedUrls.add(aboutCandidate.url);

  const galleryImages = images
    .filter((img) => {
      if (usedUrls.has(img.url)) return false;
      if (img.context === "header" || img.context === "footer") return false;
      // Prefer gallery-tagged, then services, then unknown
      return true;
    })
    .sort((a, b) => {
      // Prioritize gallery-tagged images
      const priority: Record<string, number> = { gallery: 0, services: 1, unknown: 2, hero: 3, about: 4 };
      return (priority[a.context] ?? 5) - (priority[b.context] ?? 5);
    })
    .slice(0, 8)
    .map((img) => img.url);

  return {
    hero: heroCandidate?.url || null,
    about: aboutCandidate?.url || null,
    gallery: galleryImages,
  };
}
