"use client";

import Image from "next/image";
import type { ImageLoader } from "next/image";

const passthroughLoader: ImageLoader = ({ src }) => src;

export function RemoteAvatar({
  src,
  alt = "",
  size,
  className,
}: {
  src: string;
  alt?: string;
  size: number;
  className?: string;
}) {
  return (
    <Image
      alt={alt}
      className={className}
      height={size}
      loader={passthroughLoader}
      sizes={`${size}px`}
      src={src}
      unoptimized
      width={size}
    />
  );
}
