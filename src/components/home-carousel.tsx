"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type CarouselImage = {
  src: string;
  alt: string;
};

// Keep the collection here so adding or removing a background only requires
// changing this list.
const franchiseImages: CarouselImage[] = [
  { src: "/franchise/1.png", alt: "A cinematic franchise scene" },
  { src: "/franchise/2.png", alt: "A cinematic franchise scene" },
  { src: "/franchise/3.png", alt: "A cinematic franchise scene" },
  { src: "/franchise/4.png", alt: "A cinematic franchise scene" },
];

const AUTOPLAY_DELAY = 5000;

export function HomeCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () =>
      mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion || franchiseImages.length < 2) return;

    const timer = window.setInterval(() => {
      setIsTransitioning(true);
      setActiveIndex((index) => index + 1);
    }, AUTOPLAY_DELAY);

    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  const handleTransitionEnd = () => {
    if (activeIndex >= franchiseImages.length) {
      setIsTransitioning(false);
      setActiveIndex(0);
      return;
    }
    setIsTransitioning(false);
  };

  return (
    <div className="home-carousel" aria-hidden="true">
      <div
        className={`home-carousel__track ${
          isTransitioning ? "home-carousel__track--moving" : ""
        }`}
        style={{ "--carousel-index": activeIndex } as React.CSSProperties}
        onTransitionEnd={handleTransitionEnd}
      >
        {[
          franchiseImages[franchiseImages.length - 1],
          ...franchiseImages,
          ...franchiseImages,
        ].map((image, index) => (
          <div
            className={`home-carousel__slide ${
              index === activeIndex + 2 ? "home-carousel__slide--active" : ""
            }`}
            key={`${image.src}-${index}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              preload={index < 3}
              sizes="(max-width: 640px) 68vw, (max-width: 1024px) 48vw, 34vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      <div className="home-carousel__overlay" />
    </div>
  );
}
