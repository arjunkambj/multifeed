"use client";

import Image from "next/image";
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
      sizes={`${size}px`}
      src={src}
      unoptimized
      width={size}
    />
  );
}
