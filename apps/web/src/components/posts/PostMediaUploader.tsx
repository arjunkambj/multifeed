"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button, ProgressBar } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  acceptedMedia,
  maxMediaCount,
  type ComposerMedia,
  type PostKind,
} from "./post-composer-config";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const mediaMetadata = (file: File, previewUrl: string) =>
  new Promise<{ width?: number; height?: number; durationMs?: number }>(
    (resolve) => {
      if (file.type.startsWith("image/")) {
        const image = new window.Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => resolve({});
        image.src = previewUrl;
        return;
      }
      if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.onloadedmetadata = () =>
          resolve({
            width: video.videoWidth,
            height: video.videoHeight,
            durationMs: Number.isFinite(video.duration)
              ? Math.round(video.duration * 1000)
              : undefined,
          });
        video.onerror = () => resolve({});
        video.src = previewUrl;
        return;
      }
      resolve({});
    },
  );

type Props = {
  kind: Exclude<PostKind, "text">;
  media: ComposerMedia[];
  onChange: (media: ComposerMedia[]) => void;
  onUploadingChange?: (uploading: boolean) => void;
};

export function PostMediaUploader({
  kind,
  media,
  onChange,
  onUploadingChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.media.r2.generateUploadUrl);
  const syncMetadata = useMutation(api.media.r2.syncMetadata);
  const confirmMediaUpload = useMutation(api.media.r2.confirmMediaUpload);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const maxFiles = maxMediaCount(kind);

  const confirmUpload = async (
    key: string,
    file: File,
    metadata: Awaited<ReturnType<typeof mediaMetadata>>,
  ) => {
    let lastError: unknown;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      try {
        return await confirmMediaUpload({
          r2Key: key,
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          ...metadata,
        });
      } catch (caught) {
        lastError = caught;
        await wait(300 + attempt * 100);
      }
    }
    throw lastError;
  };

  const uploadFiles = async (files: File[]) => {
    setError("");
    const room = maxFiles - media.length;
    const selectedFiles = files.slice(0, room);
    if (files.length > room) {
      setError(
        `${kind === "image" ? "Image posts" : "This format"} supports ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`,
      );
    }
    if (selectedFiles.length === 0) return;

    setUploading(true);
    onUploadingChange?.(true);
    setProgress(0);
    const uploaded: ComposerMedia[] = [];

    try {
      for (const [index, file] of selectedFiles.entries()) {
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new Error(`${file.name} is larger than 100 MB`);
        }
        const isAllowed =
          (kind === "image" && file.type.startsWith("image/")) ||
          (kind === "video" && file.type.startsWith("video/")) ||
          (kind === "story" &&
            (file.type.startsWith("image/") || file.type.startsWith("video/")));
        if (!isAllowed)
          throw new Error(`${file.name} is not valid for this format`);

        const previewUrl = URL.createObjectURL(file);
        try {
          const details = await mediaMetadata(file, previewUrl);
          const { url, key } = await generateUploadUrl({});
          const response = await fetch(url, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });
          if (!response.ok) throw new Error(`Could not upload ${file.name}`);
          setProgress(
            Math.round(((index + 0.75) / selectedFiles.length) * 100),
          );
          await syncMetadata({ key });
          const mediaAssetId = await confirmUpload(key, file, details);
          uploaded.push({
            _id: mediaAssetId,
            filename: file.name,
            mimeType: file.type,
            kind: file.type.startsWith("image/") ? "image" : "video",
            sizeBytes: file.size,
            previewUrl,
            ...details,
          });
          setProgress(Math.round(((index + 1) / selectedFiles.length) * 100));
        } catch (caught) {
          URL.revokeObjectURL(previewUrl);
          throw caught;
        }
      }
      onChange([...media, ...uploaded]);
    } catch (caught) {
      uploaded.forEach((asset) => {
        if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
      });
      setError(
        caught instanceof Error ? caught.message : "Media upload failed",
      );
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeMedia = (asset: ComposerMedia) => {
    if (asset.previewUrl) URL.revokeObjectURL(asset.previewUrl);
    onChange(media.filter((item) => item._id !== asset._id));
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={acceptedMedia(kind)}
        multiple={maxFiles > 1}
        onChange={(event) =>
          void uploadFiles(Array.from(event.currentTarget.files ?? []))
        }
      />

      {media.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((asset) => (
            <div
              key={asset._id}
              className="group relative overflow-hidden rounded-xl bg-surface-secondary"
            >
              <div className="relative aspect-video">
                {asset.kind === "image" && asset.previewUrl ? (
                  <Image
                    src={asset.previewUrl}
                    alt={asset.filename}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : asset.kind === "video" && asset.previewUrl ? (
                  <video
                    src={asset.previewUrl}
                    className="size-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted">
                    <Icon
                      icon={
                        asset.kind === "video"
                          ? "hugeicons:video-01"
                          : "hugeicons:image-02"
                      }
                      width={28}
                    />
                  </div>
                )}
                <Button
                  isIconOnly
                  size="sm"
                  variant="danger"
                  aria-label={`Remove ${asset.filename}`}
                  className="absolute right-2 top-2"
                  onPress={() => removeMedia(asset)}
                >
                  <Icon icon="hugeicons:delete-02" width={15} />
                </Button>
              </div>
              <p className="truncate px-3 py-2 text-xs">{asset.filename}</p>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <ProgressBar value={progress} aria-label="Media upload progress">
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
      )}

      {media.length < maxFiles && (
        <Button
          variant="tertiary"
          isPending={uploading}
          onPress={() => inputRef.current?.click()}
          className="h-auto min-h-28 flex-col gap-2 rounded-xl border border-dashed border-border bg-transparent py-5 hover:border-accent/50 hover:bg-surface-secondary"
        >
          <Icon icon="hugeicons:upload-04" width={22} />
          <span className="font-medium">
            {media.length === 0 ? "Add media" : "Add another image"}
          </span>
          <span className="text-xs font-normal text-muted">
            {kind === "image"
              ? "Up to 10 images"
              : kind === "video"
                ? "One video for feed, Reel, or Short"
                : "One vertical image or video"}
          </span>
        </Button>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
