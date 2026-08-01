import Image, { type ImageLoader } from "next/image";
import { Icon } from "@iconify/react";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import {
  PLATFORM_META,
  platformBrand,
  platformLabel,
} from "@/lib/platform-meta";
import type {
  ComposerMedia,
  PlatformSettings,
  PostKind,
} from "./post-composer-config";

type PreviewAccount = {
  platform: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
};

type Props = {
  account: PreviewAccount;
  body: string;
  firstComment?: string;
  media: ComposerMedia[];
  platformSettings: PlatformSettings;
  postKind: PostKind;
  referenceUrl?: string;
  title?: string;
};

type PlatformPreviewProps = Props & {
  displayName: string;
};

const passthroughLoader: ImageLoader = ({ src }) => src;

function AccountAvatar({
  account,
  size = 40,
}: {
  account: PreviewAccount;
  size?: number;
}) {
  const label = account.displayName?.trim() || account.username;

  if (account.avatarUrl) {
    return (
      <RemoteAvatar
        src={account.avatarUrl}
        alt={`${label} profile photo`}
        size={size}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: platformBrand(account.platform),
      }}
      aria-hidden
    >
      {label.slice(0, 1).toUpperCase()}
    </span>
  );
}

function RawMedia({ media }: { media: ComposerMedia[] }) {
  const asset = media[0];
  const src = asset?.previewUrl ?? asset?.publicUrl;

  if (!asset || !src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#e9ebee] text-[#65676b]">
        <Icon icon="hugeicons:image-02" width={28} />
        <span className="text-xs font-medium">Add media to see it here</span>
      </div>
    );
  }

  if (asset.kind === "video") {
    return (
      <video
        aria-label={`${asset.filename} preview`}
        className="absolute inset-0 size-full object-cover"
        muted
        playsInline
        preload="metadata"
        src={src}
      />
    );
  }

  return (
    <Image
      fill
      unoptimized
      loader={passthroughLoader}
      alt={asset.filename}
      className="object-cover"
      sizes="(max-width: 768px) 100vw, 720px"
      src={src}
    />
  );
}

function MediaFrame({
  media,
  ratio = "aspect-square",
  rounded = false,
}: {
  media: ComposerMedia[];
  ratio?: string;
  rounded?: boolean;
}) {
  const isVideo = media[0]?.kind === "video";

  return (
    <div
      className={`relative overflow-hidden bg-[#e9ebee] ${ratio} ${rounded ? "rounded-xl" : ""}`}
    >
      <RawMedia media={media} />
      {isVideo ? (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
            <Icon icon="mdi:play" width={28} />
          </span>
        </span>
      ) : null}
      {media.length > 1 ? (
        <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">
          1/{media.length}
        </span>
      ) : null}
    </div>
  );
}

function Glyph({ icon, size = 21 }: { icon: string; size?: number }) {
  return <Icon aria-hidden icon={icon} width={size} height={size} />;
}

function LinkPreview({ url, dark = false }: { url: string; dark?: boolean }) {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    // Keep the user-entered value while it is still being typed.
  }

  return (
    <div
      className={`mt-3 overflow-hidden rounded-xl border px-3 py-2.5 ${
        dark
          ? "border-white/25 bg-black/30 text-white"
          : "border-[#cfd3d7] bg-[#f7f8f9] text-[#0f1419]"
      }`}
    >
      <p className={`text-[11px] ${dark ? "text-white/65" : "text-[#536471]"}`}>
        Shared link
      </p>
      <p className="truncate text-xs font-medium">{host}</p>
    </div>
  );
}

function PreviewHeading({
  account,
  placement,
}: {
  account: PreviewAccount;
  placement?: string;
}) {
  return (
    <figcaption className="mb-2 flex items-center gap-2 px-0.5 text-xs font-medium text-muted">
      <Icon
        icon={PLATFORM_META[account.platform]?.icon ?? "hugeicons:link-01"}
        width={14}
        style={{ color: platformBrand(account.platform) }}
      />
      <span>{platformLabel(account.platform)}</span>
      <span aria-hidden>·</span>
      <span className="capitalize">{placement ?? "feed"} preview</span>
    </figcaption>
  );
}

function FacebookPreview(props: PlatformPreviewProps) {
  const { account, body, displayName, media, postKind, referenceUrl } = props;
  const placement = props.platformSettings.placement;

  if (placement === "story" || placement === "reel" || postKind === "story") {
    return <VerticalPreview {...props} variant="facebook" />;
  }

  return (
    <article className="overflow-hidden rounded-xl border border-[#d8dadf] bg-white text-[#050505]">
      <header className="flex items-center gap-2.5 p-4 pb-2">
        <AccountAvatar account={account} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {displayName}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-[#65676b]">
            Just now <span>·</span> <Glyph icon="mdi:earth" size={13} />
          </p>
        </div>
        <Glyph icon="mdi:dots-horizontal" size={22} />
      </header>
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap break-words text-[15px] leading-5">
          {body || <span className="text-[#65676b]">Your caption…</span>}
        </p>
        {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
      </div>
      {postKind !== "text" ? (
        <MediaFrame media={media} ratio="aspect-[4/3]" />
      ) : null}
      <div className="px-4 pb-2 pt-3">
        <div className="flex items-center justify-between border-b border-[#ced0d4] pb-2 text-xs text-[#65676b]">
          <span className="flex items-center gap-1">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#1877f2] text-white">
              <Glyph icon="mdi:thumb-up" size={10} />
            </span>
            Be the first to react
          </span>
          <span>0 comments</span>
        </div>
        <div className="grid grid-cols-3 pt-1 text-[#65676b]">
          {(
            [
              ["mdi:thumb-up-outline", "Like"],
              ["mdi:comment-outline", "Comment"],
              ["mdi:share-outline", "Share"],
            ] as const
          ).map(([icon, label]) => (
            <span
              key={label}
              className="flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold"
            >
              <Glyph icon={icon} size={18} /> {label}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function InstagramPreview(props: PlatformPreviewProps) {
  const { account, body, media, postKind, referenceUrl, firstComment } = props;
  const placement = props.platformSettings.placement;

  if (placement === "story" || placement === "reel" || postKind === "story") {
    return <VerticalPreview {...props} variant="instagram" />;
  }

  return (
    <article className="overflow-hidden rounded-xl border border-[#dbdbdb] bg-white text-[#0a0a0a]">
      <header className="flex items-center gap-2.5 p-3">
        <span className="rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] p-[2px]">
          <span className="block rounded-full border-2 border-white">
            <AccountAvatar account={account} size={30} />
          </span>
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold">
          {account.username}
        </p>
        <Glyph icon="mdi:dots-horizontal" size={21} />
      </header>
      <MediaFrame
        media={media}
        ratio={postKind === "video" ? "aspect-[4/5]" : "aspect-square"}
      />
      <div className="p-3 pt-2.5">
        <div className="flex items-center gap-3">
          <Glyph icon="mdi:heart-outline" size={25} />
          <Glyph icon="mdi:comment-outline" size={24} />
          <Glyph icon="mdi:send-outline" size={23} />
          <span className="ml-auto">
            <Glyph icon="mdi:bookmark-outline" size={24} />
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold">Be the first to like this</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-[18px]">
          <span className="mr-1 font-semibold">{account.username}</span>
          {body || <span className="text-[#737373]">Your caption…</span>}
        </p>
        {referenceUrl ? (
          <p className="mt-1 truncate text-xs text-[#00376b]">{referenceUrl}</p>
        ) : null}
        {firstComment ? (
          <p className="mt-1 text-xs leading-[18px]">
            <span className="mr-1 font-semibold">{account.username}</span>
            {firstComment}
          </p>
        ) : (
          <p className="mt-1 text-xs text-[#737373]">View all 0 comments</p>
        )}
        <p className="mt-2 text-[10px] uppercase tracking-wide text-[#737373]">
          Just now
        </p>
      </div>
    </article>
  );
}

function ThreadsPreview(props: PlatformPreviewProps) {
  const { account, body, media, postKind, referenceUrl, firstComment } = props;

  return (
    <article className="rounded-xl border border-[#e5e5e5] bg-white p-4 text-[#101010]">
      <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-2.5">
        <div className="flex flex-col items-center">
          <AccountAvatar account={account} size={36} />
          <span className="mt-2 w-0.5 flex-1 rounded-full bg-[#e5e5e5]" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-semibold">
              {account.username}
            </span>
            <span className="text-xs text-[#777]">now</span>
            <Glyph icon="mdi:dots-horizontal" size={20} />
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">
            {body || <span className="text-[#777]">Your caption…</span>}
          </p>
          {postKind !== "text" ? (
            <div className="mt-3">
              <MediaFrame media={media} ratio="aspect-[4/3]" rounded />
            </div>
          ) : null}
          {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
          <div className="mt-3 flex items-center gap-4 text-[#1f1f1f]">
            <Glyph icon="mdi:heart-outline" size={21} />
            <Glyph icon="mdi:comment-outline" size={20} />
            <Glyph icon="mdi:repeat-variant" size={21} />
            <Glyph icon="mdi:send-outline" size={20} />
          </div>
        </div>
        <div className="flex items-start justify-center pt-1">
          <span className="flex size-5 items-center justify-center rounded-full border border-[#d8d8d8] bg-white text-[12px] font-semibold">
            +
          </span>
        </div>
        <div className="min-w-0 text-xs text-[#777]">
          {firstComment ? (
            <>
              <span className="font-semibold text-[#101010]">
                {account.username}
              </span>{" "}
              {firstComment}
            </>
          ) : (
            "No replies yet"
          )}
        </div>
      </div>
    </article>
  );
}

function LinkedInPreview(props: PlatformPreviewProps) {
  const {
    account,
    body,
    displayName,
    media,
    postKind,
    referenceUrl,
    firstComment,
  } = props;

  return (
    <article className="overflow-hidden rounded-lg border border-[#d6d6d6] bg-white text-[#1f1f1f]">
      <header className="flex items-start gap-2 p-3 pb-2">
        <AccountAvatar account={account} size={46} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-5">
            {displayName}
          </p>
          <p className="truncate text-[11px] leading-4 text-[#666]">
            @{account.username}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-[#666]">
            Now · <Glyph icon="mdi:earth" size={12} />
          </p>
        </div>
        <Glyph icon="mdi:dots-horizontal" size={22} />
      </header>
      <div className="px-3 pb-3">
        <p className="whitespace-pre-wrap break-words text-[13px] leading-[19px]">
          {body || <span className="text-[#666]">Your caption…</span>}
        </p>
        {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
      </div>
      {postKind !== "text" ? (
        <MediaFrame media={media} ratio="aspect-[1.91/1]" />
      ) : null}
      <div className="px-3 pt-2">
        <div className="flex items-center justify-between border-b border-[#e5e5e5] pb-2 text-[11px] text-[#666]">
          <span className="flex items-center gap-1">
            <span className="flex size-4 items-center justify-center rounded-full bg-[#378fe9] text-white">
              <Glyph icon="mdi:thumb-up" size={10} />
            </span>
            0
          </span>
          <span>0 comments</span>
        </div>
        <div className="grid grid-cols-4 py-1 text-[#404040]">
          {(
            [
              ["mdi:thumb-up-outline", "Like"],
              ["mdi:comment-outline", "Comment"],
              ["mdi:repeat-variant", "Repost"],
              ["mdi:send-outline", "Send"],
            ] as const
          ).map(([icon, label]) => (
            <span
              key={label}
              className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold sm:flex-row sm:justify-center sm:text-xs"
            >
              <Glyph icon={icon} size={18} /> {label}
            </span>
          ))}
        </div>
        {firstComment ? (
          <p className="border-t border-[#e5e5e5] py-2 text-xs">
            <span className="font-semibold">{displayName}</span> {firstComment}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function XPreview(props: PlatformPreviewProps) {
  const {
    account,
    body,
    displayName,
    media,
    postKind,
    referenceUrl,
    firstComment,
  } = props;

  return (
    <article className="rounded-xl border border-[#eff3f4] bg-white p-4 text-[#0f1419]">
      <div className="flex items-start gap-2.5">
        <AccountAvatar account={account} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1 text-sm leading-5">
            <span className="truncate font-bold">{displayName}</span>
            <span className="truncate text-[#536471]">
              @{account.username} · now
            </span>
            <span className="ml-auto">
              <Glyph icon="mdi:dots-horizontal" size={20} />
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-5">
            {body || (
              <span className="text-[#536471]">What&apos;s happening?</span>
            )}
          </p>
          {postKind !== "text" ? (
            <div className="mt-3">
              <MediaFrame media={media} ratio="aspect-[16/9]" rounded />
            </div>
          ) : null}
          {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
          <div className="mt-3 flex items-center justify-between pr-3 text-[#536471]">
            <span className="flex items-center gap-1 text-[11px]">
              <Glyph icon="mdi:comment-outline" size={18} />
              {firstComment ? "1" : ""}
            </span>
            <Glyph icon="mdi:repeat-variant" size={19} />
            <Glyph icon="mdi:heart-outline" size={19} />
            <Glyph icon="mdi:chart-bar" size={19} />
            <Glyph icon="mdi:bookmark-outline" size={18} />
            <Glyph icon="mdi:share-outline" size={18} />
          </div>
          {firstComment ? (
            <p className="mt-3 border-t border-[#eff3f4] pt-3 text-xs">
              <span className="font-bold">@{account.username}</span>{" "}
              {firstComment}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function YouTubePreview(props: PlatformPreviewProps) {
  const { account, body, displayName, media, platformSettings, title } = props;

  if (platformSettings.placement === "short") {
    return <VerticalPreview {...props} variant="youtube" />;
  }

  const videoTitle =
    platformSettings.title?.trim() ||
    title?.trim() ||
    body.split("\n")[0]?.trim() ||
    "Video title";

  return (
    <article className="rounded-xl border border-[#e5e5e5] bg-white p-3 text-[#0f0f0f]">
      <MediaFrame media={media} ratio="aspect-video" rounded />
      <div className="mt-3 flex items-start gap-2.5">
        <AccountAvatar account={account} size={36} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-5">
            {videoTitle}
          </p>
          <p className="mt-1 truncate text-xs text-[#606060]">{displayName}</p>
          <p className="text-xs text-[#606060]">No views · just now</p>
        </div>
        <Glyph icon="mdi:dots-vertical" size={21} />
      </div>
    </article>
  );
}

type VerticalVariant = "facebook" | "instagram" | "tiktok" | "youtube";

const VERTICAL_CONFIG: Record<
  VerticalVariant,
  {
    accent: string;
    actionIcons: string[];
    actionLabels: string[];
    primaryAction?: string;
  }
> = {
  facebook: {
    accent: "#1877f2",
    actionIcons: [
      "mdi:thumb-up-outline",
      "mdi:comment-outline",
      "mdi:share-outline",
    ],
    actionLabels: ["Like", "Comment", "Share"],
  },
  instagram: {
    accent: "#ffffff",
    actionIcons: [
      "mdi:heart-outline",
      "mdi:comment-outline",
      "mdi:send-outline",
      "mdi:dots-horizontal",
    ],
    actionLabels: ["Like", "Comment", "Share", "More"],
  },
  tiktok: {
    accent: "#fe2c55",
    actionIcons: ["mdi:heart", "mdi:comment", "mdi:bookmark", "mdi:share"],
    actionLabels: ["Like", "Comment", "Save", "Share"],
    primaryAction: "Follow",
  },
  youtube: {
    accent: "#ff0033",
    actionIcons: [
      "mdi:thumb-up-outline",
      "mdi:thumb-down-outline",
      "mdi:comment-outline",
      "mdi:share-outline",
    ],
    actionLabels: ["Like", "Dislike", "Comment", "Share"],
    primaryAction: "Subscribe",
  },
};

function VerticalPreview(
  props: PlatformPreviewProps & { variant: VerticalVariant },
) {
  const { account, body, displayName, media, postKind, referenceUrl, variant } =
    props;
  const config = VERTICAL_CONFIG[variant];
  const isStory =
    props.platformSettings.placement === "story" || postKind === "story";

  return (
    <div className="mx-auto w-full max-w-[20rem] overflow-hidden rounded-[1.35rem] bg-[#e9ebee]">
      <div className="relative aspect-[9/16] overflow-hidden bg-[#e9ebee] text-white">
        <RawMedia media={media} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />
        {isStory ? (
          <>
            <div className="absolute inset-x-3 top-3">
              <div className="mb-2 flex gap-1">
                <span className="h-0.5 flex-1 rounded-full bg-white" />
                <span className="h-0.5 flex-1 rounded-full bg-white/35" />
                <span className="h-0.5 flex-1 rounded-full bg-white/35" />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AccountAvatar account={account} size={30} />
                <span className="min-w-0 flex-1 truncate">
                  {account.username}
                </span>
                <span className="font-normal text-white/75">now</span>
                <Glyph icon="mdi:dots-horizontal" size={20} />
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-4 flex items-center gap-2">
              <span className="flex-1 rounded-full border border-white/80 px-4 py-2.5 text-xs text-white/90">
                Send message
              </span>
              <Glyph icon="mdi:heart-outline" size={25} />
              <Glyph icon="mdi:send-outline" size={24} />
            </div>
          </>
        ) : (
          <>
            <div className="absolute right-2.5 top-1/2 flex -translate-y-1/3 flex-col items-center gap-4">
              <div className="relative mb-1">
                <AccountAvatar account={account} size={38} />
                {config.primaryAction ? (
                  <span
                    className="absolute -bottom-2 left-1/2 flex size-4 -translate-x-1/2 items-center justify-center rounded-full text-[13px] font-bold text-white"
                    style={{ backgroundColor: config.accent }}
                  >
                    +
                  </span>
                ) : null}
              </div>
              {config.actionIcons.map((icon, index) => (
                <span
                  key={icon}
                  className="flex flex-col items-center gap-0.5 text-[9px] font-medium drop-shadow"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-black/25">
                    <Glyph icon={icon} size={24} />
                  </span>
                  {config.actionLabels[index]}
                </span>
              ))}
            </div>
            <div className="absolute inset-x-3 bottom-4 pr-12 text-xs drop-shadow">
              <div className="flex items-center gap-2">
                <span className="font-semibold">@{account.username}</span>
                {config.primaryAction ? (
                  <span
                    className="rounded px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: config.accent }}
                  >
                    {config.primaryAction}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap leading-4">
                {body || <span className="text-white/70">Your caption…</span>}
              </p>
              {referenceUrl ? (
                <p className="mt-1 truncate text-[10px] text-white/80">
                  {referenceUrl}
                </p>
              ) : null}
              <p className="mt-2 flex items-center gap-1 text-[10px] font-medium">
                <Glyph icon="mdi:music-note" size={14} /> Original audio ·{" "}
                {displayName}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TikTokPreview(props: PlatformPreviewProps) {
  return <VerticalPreview {...props} variant="tiktok" />;
}

export function PlatformPostPreview(props: Props) {
  const displayName =
    props.account.displayName?.trim() || props.account.username;
  const previewProps = { ...props, displayName };
  const placement = props.platformSettings.placement;

  let preview;
  switch (props.account.platform) {
    case "facebook":
      preview = <FacebookPreview {...previewProps} />;
      break;
    case "instagram":
      preview = <InstagramPreview {...previewProps} />;
      break;
    case "threads":
      preview = <ThreadsPreview {...previewProps} />;
      break;
    case "linkedin":
      preview = <LinkedInPreview {...previewProps} />;
      break;
    case "youtube":
      preview = <YouTubePreview {...previewProps} />;
      break;
    case "x":
      preview = <XPreview {...previewProps} />;
      break;
    case "tiktok":
      preview = <TikTokPreview {...previewProps} />;
      break;
    default:
      return null;
  }

  return (
    <figure
      aria-label={`${platformLabel(props.account.platform)} post preview`}
      className="w-[min(100%,20rem)] shrink-0"
    >
      <PreviewHeading account={props.account} placement={placement} />
      {preview}
    </figure>
  );
}
