"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Button, Spinner, toast } from "@heroui/react";
import { Icon } from "@iconify/react";
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
    reader.onerror = () => reject(reader.error ?? new Error("Could not preview file"));
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
      className="group w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-secondary"
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
          <div className="flex size-full items-center justify-center text-muted">
            <Icon
              icon={
                kind === "video" ? "hugeicons:video-01" : "hugeicons:image-02"
              }
              width={24}
            />
          </div>
        )}

        {isBusy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white">
            <Spinner color="current" size="md" />
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
            isIconOnly
            size="sm"
            variant="danger"
            aria-label={`Remove ${filename}`}
            className="absolute right-1.5 top-1.5"
            onPress={onRemove}
          >
            <Icon icon="hugeicons:delete-02" width={14} />
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

  const uploadFiles = (files: File[]) => {
    const room = maxFiles - media.length;
    const selectedFiles = files.slice(0, room);
    if (files.length > room) {
      toast.danger(
        `${kind === "image" ? "Image posts" : "This format"} supports ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`,
        { timeout: 3000 },
      );
    }
    if (selectedFiles.length === 0) return;

    setUploading(true);
    onUploadingChange?.(true);
    const uploaded: ComposerMedia[] = [];
    let pendingUploads: PendingMedia[] = [];

    const finishUpload = (caught: unknown) => {
      if (uploaded.length > 0) onChange([...media, ...uploaded]);
      setPendingMedia([]);
      toast.danger(
        caught instanceof Error ? caught.message : "Media upload failed",
        { timeout: 6000 },
      );
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = "";
    };

    for (const file of selectedFiles) {
      if (file.size > MAX_UPLOAD_BYTES) {
        finishUpload(new Error(`${file.name} is larger than 100 MB`));
        return;
      }
      const isAllowed =
        (kind === "image" && file.type.startsWith("image/")) ||
        (kind === "video" && file.type.startsWith("video/")) ||
        (kind === "story" &&
          (file.type.startsWith("image/") || file.type.startsWith("video/")));
      if (!isAllowed) {
        finishUpload(new Error(`${file.name} is not valid for this format`));
        return;
      }
    }

    void (async () => {
      try {
        pendingUploads = await Promise.all(
          selectedFiles.map(async (file, index) => ({
            id: `${file.name}-${file.lastModified}-${index}`,
            file,
            previewUrl: await readPreviewUrl(file),
            progress: 0,
          })),
        );
        setPendingMedia(pendingUploads);
      } catch (caught) {
        finishUpload(caught);
        return;
      }

      const uploadPending = (pending: PendingMedia) => {
        const { file, id, previewUrl } = pending;
        return mediaMetadata(file, previewUrl)
          .then((details) =>
            uploadFile(file, {
              onProgress: ({ loaded, total }) => {
                const progress =
                  total > 0 ? Math.round((loaded / total) * 100) : 0;
                setPendingMedia((current) =>
                  current.map((item) =>
                    item.id === id ? { ...item, progress } : item,
                  ),
                );
              },
            })
              .catch((caught) =>
                Promise.reject(uploadTransportError(file, caught)),
              )
              .then((key) => confirmUpload(key, file, details))
              .then((mediaAssetId) => ({
                _id: mediaAssetId,
                filename: file.name,
                mimeType: file.type,
                kind: (file.type.startsWith("image/") ? "image" : "video") as
                  | "image"
                  | "video",
                sizeBytes: file.size,
                previewUrl,
                ...details,
              })),
          )
          .then((asset) => {
            setPendingMedia((current) =>
              current.map((item) =>
                item.id === id ? { ...item, progress: 100 } : item,
              ),
            );
            return asset;
          });
      };

      const uploadSequence = pendingUploads.reduce<Promise<void>>(
        (chain, pending) =>
          chain.then(() =>
            uploadPending(pending).then((asset) => {
              uploaded.push(asset);
            }),
          ),
        Promise.resolve(),
      );

      void uploadSequence
        .then(() => {
          onChange([...media, ...uploaded]);
          setPendingMedia([]);
          toast.success(
            `${uploaded.length} file${uploaded.length === 1 ? "" : "s"} uploaded.`,
            { timeout: 3000 },
          );
        })
        .catch(finishUpload)
        .finally(() => {
          setUploading(false);
          onUploadingChange?.(false);
          if (inputRef.current) inputRef.current.value = "";
        });
    })();
  };

  const removeMedia = (asset: ComposerMedia) => {
    if (deletingMediaId !== null) return;
    setDeletingMediaId(asset._id);
    void deleteMedia({ mediaAssetId: asset._id })
      .then(() => {
        onChange(media.filter((item) => item._id !== asset._id));
        toast.success("Media deleted from storage.", { timeout: 3000 });
      })
      .catch((caught) => {
        toast.danger(
          caught instanceof Error ? caught.message : "Could not delete media",
          { timeout: 6000 },
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
        type="file"
        accept={acceptedMedia(kind)}
        multiple={maxFiles > 1}
        onChange={(event) =>
          void uploadFiles(Array.from(event.currentTarget.files ?? []))
        }
      />

      {media.length + pendingMedia.length < maxFiles && (
        <Button
          variant="tertiary"
          isDisabled={uploading}
          onPress={() => inputRef.current?.click()}
          aria-label={
            media.length === 0 && pendingMedia.length === 0
              ? "Add media"
              : "Add another media file"
          }
          className="h-24 w-36 shrink-0 flex-col gap-1.5 rounded-xl border border-dashed border-border bg-transparent px-3 py-3 hover:border-accent/50 hover:bg-surface-secondary"
        >
          <Icon icon="hugeicons:upload-04" width={20} />
          <span className="text-sm font-medium">
            {media.length === 0 && pendingMedia.length === 0
              ? "Add media"
              : "Add another"}
          </span>
          <span className="text-[11px] font-normal text-muted">
            {kind === "image"
              ? "Up to 10 images"
              : kind === "video"
                ? "One video"
                : "Image or video"}
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
              previewUrl={asset.previewUrl}
              busyLabel={deletingMediaId === asset._id ? "Deleting" : undefined}
              onRemove={
                deletingMediaId === null
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
