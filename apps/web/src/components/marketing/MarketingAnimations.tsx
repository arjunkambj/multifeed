"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect } from "react";

const revealEase = "power3.out";

export function MarketingAnimations() {
  useLayoutEffect(() => {
    const scope = document.querySelector<HTMLElement>(".marketing-landing");

    if (!scope) return;

    gsap.registerPlugin(ScrollTrigger);

    const responsiveAnimations = gsap.matchMedia();
    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        scope.dataset.gsapReady = "true";
        return;
      }

      const heroCopy = gsap.utils.toArray<HTMLElement>(
        "[data-gsap-hero-copy] > *",
      );
      const heroUnderline = gsap.utils.toArray<HTMLElement>(
        "[data-gsap-underline]",
      );
      const heroVisual = gsap.utils.toArray<HTMLElement>(
        "[data-gsap-hero-visual]",
      );

      gsap.set(heroCopy, { autoAlpha: 0, y: 28 });
      gsap.set(heroUnderline, {
        scaleX: 0,
        transformOrigin: "left center",
      });
      gsap.set(heroVisual, { autoAlpha: 0, scale: 0.975, y: 48 });
      scope.dataset.gsapReady = "true";

      gsap.from("[data-gsap-nav]", {
        autoAlpha: 0,
        duration: 0.65,
        ease: revealEase,
        y: -18,
      });

      const hero = gsap.timeline({ defaults: { ease: revealEase } });

      hero
        .to(heroCopy, {
          autoAlpha: 1,
          duration: 0.72,
          stagger: 0.08,
          y: 0,
        })
        .to(
          heroUnderline,
          {
            duration: 0.55,
            scaleX: 1,
          },
          "-=0.3",
        )
        .to(
          heroVisual,
          {
            autoAlpha: 1,
            duration: 0.9,
            scale: 1,
            y: 0,
          },
          "-=0.42",
        );

      gsap.utils
        .toArray<HTMLElement>("[data-gsap-section]")
        .forEach((section) => {
          const headingItems = section.querySelectorAll(
            "[data-gsap-heading] > *",
          );
          const cards = section.querySelectorAll("[data-gsap-card]");
          const bars = section.querySelectorAll("[data-gsap-bar]");
          const timeline = gsap.timeline({
            defaults: { ease: revealEase },
            scrollTrigger: {
              start: "top 78%",
              toggleActions: "play none none none",
              trigger: section,
            },
          });

          if (headingItems.length) {
            timeline.from(headingItems, {
              autoAlpha: 0,
              duration: 0.62,
              stagger: 0.07,
              y: 24,
            });
          }

          if (cards.length) {
            timeline.from(
              cards,
              {
                autoAlpha: 0,
                duration: 0.68,
                scale: 0.985,
                stagger: 0.09,
                y: 34,
              },
              headingItems.length ? "-=0.28" : 0,
            );
          }

          if (bars.length) {
            timeline.from(
              bars,
              {
                duration: 0.8,
                scaleY: 0,
                stagger: 0.06,
                transformOrigin: "bottom center",
              },
              "-=0.5",
            );
          }
        });

      gsap.utils.toArray<HTMLElement>("[data-gsap-depth]").forEach((media) => {
        gsap.fromTo(
          media,
          { yPercent: -3 },
          {
            ease: "none",
            scrollTrigger: {
              end: "bottom top",
              scrub: 1,
              start: "top bottom",
              trigger: media,
            },
            yPercent: 3,
          },
        );
      });

      responsiveAnimations.add("(min-width: 768px)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-gsap-stack-card]");

        cards.slice(0, -1).forEach((card, index) => {
          const surface = card.querySelector<HTMLElement>(
            "[data-gsap-stack-surface]",
          );
          const nextCard = cards[index + 1];

          if (!surface || !nextCard) return;

          const remainingCards = cards.length - index - 1;

          gsap.to(surface, {
            ease: "none",
            scale: 1 - remainingCards * 0.018,
            scrollTrigger: {
              end: `top ${96 + (index + 1) * 28}px`,
              scrub: 0.6,
              start: "top 72%",
              trigger: nextCard,
            },
            transformOrigin: "top center",
            y: remainingCards * -8,
          });
        });
      });
    }, scope);

    return () => {
      delete scope.dataset.gsapReady;
      responsiveAnimations.revert();
      context.revert();
    };
  }, []);

  return null;
}
