"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  Image as ImageIcon,
  ImageAdd,
  Trash,
  VideoCamera,
} from "@honeyicons/react";
import { useUploadFile } from "@convex-dev/r2/react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import {
  acceptedMedia,
  maxMediaCount,
  type ComposerMedia,
  type PostKind,
} from "./post-composer-config";

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const uploadTransportError = (file: File, caught: unknown) => {
  if (
    caught instanceof Error &&
    (caught.message === "Failed to fetch" ||
      caught.message === "Failed to upload file")
  ) {
    return new Error(
      `Could not upload ${file.name}. Allow ${window.location.origin} to PUT Content-Type in the R2 bucket CORS policy.`,
    );
  }
  return caught;
};

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

type MediaMeta = {
  width?: number;
  height?: number;
  durationMs?: number;
};

type PendingMedia = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
};

function readPreviewUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not preview file"));
    reader.readAsDataURL(file);
  });
}

const mediaMetadata = (file: File, previewUrl: string) =>
  new Promise<MediaMeta>((resolve) => {
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
  });

type MediaPreviewCardProps = {
  filename: string;
  kind: "image" | "video" | "document";
  previewUrl?: string;
  busyLabel?: string;
  uploadProgress?: number;
  onRemove?: () => void;
};

function MediaPreviewCard({
  filename,
  kind,
  previewUrl,
  busyLabel,
  uploadProgress,
  onRemove,
}: MediaPreviewCardProps) {
  const isBusy = busyLabel !== undefined;

  return (
    <div
      className="group w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
      aria-busy={isBusy}
    >
      <div className="relative aspect-video">
        {kind === "image" && previewUrl ? (
          <Image
            src={previewUrl}
            alt={filename}
            fill
            unoptimized
            sizes="128px"
            className="object-cover"
          />
        ) : kind === "video" && previewUrl ? (
          <video
            src={previewUrl}
            className="size-full object-cover"
            muted
            playsInline
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            {kind === "video" ? (
              <VideoCamera size={24} />
            ) : (
              <ImageIcon size={24} />
            )}
          </div>
        )}

        {isBusy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
            <Spinner className="size-5" />
            <span className="text-xs font-medium tabular-nums">
              {uploadProgress === undefined ? busyLabel : `${uploadProgress}%`}
            </span>
            <span className="sr-only">
              {busyLabel} {filename}
            </span>
          </div>
        )}

        {onRemove && (
          <Button
            size="icon-sm"
            variant="destructive"
            aria-label={`Remove ${filename}`}
            className="absolute right-1.5 top-1.5"
            onClick={onRemove}
          >
            <Trash size={14} />
          </Button>
        )}
      </div>
      <p className="truncate px-2.5 py-2 text-xs">{filename}</p>
    </div>
  );
}

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
  "use no memo";

  const inputRef = useRef<HTMLInputElement>(null);
  const uploadFile = useUploadFile(api.media.r2);
  const confirmMediaUpload = useMutation(api.media.r2.confirmMediaUpload);
  const deleteMedia = useMutation(api.media.r2.deleteMedia);
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<
    ComposerMedia["_id"] | null
  >(null);
  const maxFiles = maxMediaCount(kind);

  const confirmUpload = async (
    key: string,
    file: File,
    metadata: MediaMeta,
  ) => {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const mediaAssetId = await confirmMediaUpload({
        r2Key: key,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        ...metadata,
      });
      if (mediaAssetId !== null) return mediaAssetId;
      await wait(300 + attempt * 100);
    }
    throw new Error(`Timed out while processing ${file.name}`);
  };

  const uploadFiles = async (files: File[]) => {
    if (uploading || deletingMediaId !== null) return;
    const room = Math.max(0, maxFiles - media.length);
    const selectedFiles = files.slice(0, room);
    if (files.length > room) {
      toast.error(
        `${kind === "image" ? "Image posts" : "This format"} supports ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`,
      );
    }
    if (selectedFiles.length === 0) return;

    setUploading(true);
    onUploadingChange?.(true);
    const uploaded: ComposerMedia[] = [];

    try {
      for (const file of selectedFiles) {
        if (file.size > MAX_UPLOAD_BYTES) {
          throw new Error(`${file.name} is larger than 100 MB`);
        }
        const isAllowed =
          (kind === "image" && file.type.startsWith("image/")) ||
          (kind === "video" && file.type.startsWith("video/")) ||
          (kind === "story" &&
            (file.type.startsWith("image/") || file.type.startsWith("video/")));
        if (!isAllowed) {
          throw new Error(`${file.name} is not valid for this format`);
        }
      }

      const pendingUploads = await Promise.all(
        selectedFiles.map(async (file, index) => ({
          id: `${file.name}-${file.lastModified}-${index}`,
          file,
          previewUrl: await readPreviewUrl(file),
          progress: 0,
        })),
      );
      setPendingMedia(pendingUploads);

      for (const { file, id, previewUrl } of pendingUploads) {
        const details = await mediaMetadata(file, previewUrl);
        let key: string;
        try {
          key = await uploadFile(file, {
            onProgress: ({ loaded, total }) => {
              const progress =
                total > 0 ? Math.round((loaded / total) * 100) : 0;
              setPendingMedia((current) =>
                current.map((item) =>
                  item.id === id ? { ...item, progress } : item,
                ),
              );
            },
          });
        } catch (caught) {
          throw uploadTransportError(file, caught);
        }
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
      }
      // Commit only when every file in the batch finished uploading — a
      // partial attach after a failure toast would surprise the user.
      if (uploaded.length > 0) onChange([...media, ...uploaded]);
      toast.success(
        `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded.`,
      );
    } catch (caught) {
      toast.error(
        caught instanceof Error ? caught.message : "Media upload failed",
      );
      // Best-effort cleanup of files that did finish, so a failed batch
      // doesn't leave orphaned objects in storage.
      for (const asset of uploaded) {
        void deleteMedia({ mediaAssetId: asset._id }).catch(() => {});
      }
    } finally {
      setPendingMedia([]);
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeMedia = (asset: ComposerMedia) => {
    if (uploading || deletingMediaId !== null) return;
    setDeletingMediaId(asset._id);
    void deleteMedia({ mediaAssetId: asset._id })
      .then(() => {
        onChange(media.filter((item) => item._id !== asset._id));
        toast.success("Media deleted from storage.");
      })
      .catch((caught) => {
        toast.error(
          caught instanceof Error ? caught.message : "Could not delete media",
        );
      })
      .finally(() => setDeletingMediaId(null));
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        aria-label="Select media files"
        className="sr-only"
        tabIndex={-1}
        type="file"
        accept={acceptedMedia(kind)}
        multiple={maxFiles > 1}
        onChange={(event) =>
          void uploadFiles(Array.from(event.currentTarget.files ?? []))
        }
      />

      {media.length + pendingMedia.length < maxFiles && (
        <Button
          variant="ghost"
          disabled={uploading || deletingMediaId !== null}
          onClick={() => inputRef.current?.click()}
          aria-label={
            media.length === 0 && pendingMedia.length === 0
              ? "Add media"
              : "Add another media file"
          }
          onDragOver={(event) => {
            event.preventDefault();
            if (!uploading && deletingMediaId === null) setIsDragging(true);
          }}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void uploadFiles(Array.from(event.dataTransfer.files));
          }}
          className={cn(
            "h-auto min-h-28 w-full gap-4 whitespace-normal border border-dashed px-4 py-4",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20",
          )}
        >
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background"
            aria-hidden
          >
            {kind === "video" ? <VideoCamera /> : <ImageAdd />}
          </span>
          <span className="flex flex-col items-start gap-1.5 text-left">
            <span>
              {isDragging
                ? "Drop to upload"
                : media.length === 0 && pendingMedia.length === 0
                  ? kind === "video"
                    ? "Add a video"
                    : "Add media"
                  : "Add another file"}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Drag and drop or{" "}
              <span className="text-primary underline underline-offset-2">
                browse files
              </span>
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {kind === "image"
                ? "Up to 10 images"
                : kind === "video"
                  ? "One video"
                  : "Image or video"}{" "}
              · 100 MB per file
            </span>
          </span>
        </Button>
      )}

      {(media.length > 0 || pendingMedia.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {media.map((asset) => (
            <MediaPreviewCard
              key={asset._id}
              filename={asset.filename}
              kind={asset.kind}
              previewUrl={asset.previewUrl ?? asset.publicUrl}
              busyLabel={deletingMediaId === asset._id ? "Deleting" : undefined}
              onRemove={
                !uploading && deletingMediaId === null
                  ? () => void removeMedia(asset)
                  : undefined
              }
            />
          ))}
          {pendingMedia.map((asset) => (
            <MediaPreviewCard
              key={asset.id}
              filename={asset.file.name}
              kind={asset.file.type.startsWith("image/") ? "image" : "video"}
              previewUrl={asset.previewUrl}
              busyLabel="Uploading"
              uploadProgress={asset.progress}
            />
          ))}
        </div>
      )}
    </div>
  );
}
