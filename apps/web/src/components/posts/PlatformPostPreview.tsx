import {
  Bookmark,
  Dislike,
  Email,
  Image as ImageIcon,
  ImageAdd,
  Integration,
  Like,
  MoreHorizontal,
  MoreVertical,
  PaperPlane,
  Play,
  Repeat,
  Search,
  Share,
  Soundwave,
  type HoneyIcon,
} from "@honeyicons/react";
import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import { RemoteAvatar } from "@/components/RemoteAvatar";
import { cn } from "@multifeed/ui/lib/utils";
import {
  platformBrand,
  platformForeground,
  platformIcon,
  platformInk,
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
        className="shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className="flex size-(--preview-avatar-size) shrink-0 items-center justify-center rounded-full bg-(--preview-avatar-bg) text-sm font-semibold text-(--preview-avatar-fg)"
      style={
        {
          "--preview-avatar-size": `${size}px`,
          "--preview-avatar-bg": platformBrand(account.platform),
          "--preview-avatar-fg": platformForeground(account.platform),
        } as CSSProperties
      }
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
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-preview-fill text-preview-muted">
        <ImageIcon size={28} />
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
  mosaic = false,
}: {
  media: ComposerMedia[];
  ratio?: string;
  rounded?: boolean;
  mosaic?: boolean;
}) {
  if (mosaic && media.length > 1) {
    return (
      <div
        className={`grid aspect-[4/3] grid-cols-2 gap-0.5 overflow-hidden bg-preview-fill ${rounded ? "rounded-2xl border border-preview-line" : ""}`}
      >
        {media.slice(0, 4).map((asset, index) => (
          <div
            key={asset._id}
            className={`relative min-h-0 overflow-hidden ${media.length === 3 && index === 0 ? "row-span-2" : ""}`}
          >
            <RawMedia media={[asset]} />
            {asset.kind === "video" ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/10 text-white">
                <Glyph icon={Play} size={32} />
              </span>
            ) : null}
            {index === 3 && media.length > 4 ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-2xl font-semibold text-white">
                +{media.length - 4}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  const isVideo = media[0]?.kind === "video";

  return (
    <div
      className={`relative overflow-hidden bg-preview-fill ${ratio} ${rounded ? "rounded-xl" : ""}`}
    >
      <RawMedia media={media} />
      {isVideo ? (
        <span
          className="absolute inset-0 flex items-center justify-center"
          aria-hidden
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-black/65 text-white backdrop-blur-sm">
            <Play size={28} />
          </span>
        </span>
      ) : null}
      {media.length > 1 ? (
        <span className="absolute right-3 top-3 rounded-full bg-black/65 px-2 py-1 text-xs font-semibold text-white">
          1/{media.length}
        </span>
      ) : null}
    </div>
  );
}

function Glyph({ icon: Icon, size = 21 }: { icon: HoneyIcon; size?: number }) {
  return <Icon aria-hidden className="shrink-0" size={size} />;
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
          : "border-preview-line bg-preview-fill text-preview-ink"
      }`}
    >
      <p className={`text-xs ${dark ? "text-white/65" : "text-preview-muted"}`}>
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
  const MetaIcon = platformIcon(account.platform);
  return (
    <figcaption className="mb-2 flex items-center gap-2 px-0.5 text-xs font-medium text-muted-foreground">
      <MetaIcon
        className="text-(--ink)"
        size={14}
        style={{ "--ink": platformInk(account.platform) } as CSSProperties}
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
    <article className="overflow-hidden rounded-xl border border-preview-line bg-white text-preview-ink">
      <header className="flex items-center gap-2.5 p-4 pb-2">
        <AccountAvatar account={account} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-tight">
            {displayName}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-preview-muted">
            Just now <span>·</span> <Glyph icon={Integration} size={13} />
          </p>
        </div>
        <Glyph icon={MoreHorizontal} size={22} />
      </header>
      <div className="px-4 pb-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-5">
          {body || <span className="text-preview-muted">Your caption…</span>}
        </p>
        {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
      </div>
      {postKind !== "text" ? (
        <MediaFrame media={media} ratio="aspect-[4/3]" mosaic />
      ) : null}
      <div className="px-4 pb-2 pt-3">
        <div className="grid grid-cols-3 border-t border-preview-line pt-1 text-preview-muted">
          {(
            [
              [Like, "Like"],
              [Email, "Comment"],
              [Share, "Share"],
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
    <article className="overflow-hidden rounded-sm border border-preview-line bg-white text-preview-ink">
      <header className="flex items-center gap-2.5 p-3">
        <span className="rounded-full bg-gradient-to-tr from-ig-gold via-ig-pink to-ig-violet p-0.5">
          <span className="block rounded-full border-2 border-white">
            <AccountAvatar account={account} size={30} />
          </span>
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {account.username}
        </p>
        <Glyph icon={MoreHorizontal} size={21} />
      </header>
      <MediaFrame
        media={media}
        ratio={postKind === "video" ? "aspect-[4/5]" : "aspect-square"}
      />
      <div className="p-3 pt-2.5">
        <div className="relative flex items-center gap-3">
          {media.length > 1 ? (
            <span
              className="absolute left-1/2 flex -translate-x-1/2 gap-1"
              aria-hidden
            >
              {media.slice(0, 5).map((asset, index) => (
                <span
                  key={asset._id}
                  className={`size-1.5 rounded-full ${index === 0 ? "bg-ig-blue" : "bg-preview-line"}`}
                />
              ))}
            </span>
          ) : null}
          <Glyph icon={Like} size={25} />
          <Glyph icon={Email} size={24} />
          <Glyph icon={PaperPlane} size={23} />
          <span className="ml-auto">
            <Glyph icon={Bookmark} size={24} />
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">
          <span className="mr-1 font-semibold">{account.username}</span>
          {body || <span className="text-preview-muted">Your caption…</span>}
        </p>
        {referenceUrl ? (
          <p className="mt-1 truncate text-sm text-ig-link">{referenceUrl}</p>
        ) : null}
        {firstComment ? (
          <p className="mt-1 text-sm leading-5">
            <span className="mr-1 font-semibold">{account.username}</span>
            {firstComment}
          </p>
        ) : null}
        <p className="mt-2 text-xs uppercase tracking-wide text-preview-muted">
          Just now
        </p>
      </div>
    </article>
  );
}

function ThreadsPreview(props: PlatformPreviewProps) {
  const { account, body, media, postKind, referenceUrl, firstComment } = props;

  return (
    <article className="border-y border-preview-line bg-white px-4 py-3 text-preview-ink">
      <div className="grid grid-cols-[38px_minmax(0,1fr)] gap-2.5">
        <div className="flex flex-col items-center">
          <AccountAvatar account={account} size={36} />
          <span
            className={`mt-2 w-0.5 flex-1 rounded-full ${firstComment ? "bg-preview-line" : "bg-transparent"}`}
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate font-semibold">
              {account.username}
            </span>
            <span className="text-xs text-preview-muted">now</span>
            <Glyph icon={MoreHorizontal} size={20} />
          </div>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5">
            {body || <span className="text-preview-muted">Your caption…</span>}
          </p>
          {postKind !== "text" ? (
            <div className="mt-3">
              <MediaFrame media={media} ratio="aspect-[4/3]" rounded />
            </div>
          ) : null}
          {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
          <div className="mt-3 flex items-center gap-4 text-preview-ink">
            <Glyph icon={Like} size={21} />
            <Glyph icon={Email} size={20} />
            <Glyph icon={Repeat} size={21} />
            <Glyph icon={PaperPlane} size={20} />
          </div>
        </div>
        {firstComment ? (
          <>
            <div className="flex justify-center pt-1">
              <AccountAvatar account={account} size={28} />
            </div>
            <p className="min-w-0 whitespace-pre-wrap text-sm leading-5">
              <span className="mr-1 font-semibold">{account.username}</span>
              {firstComment}
            </p>
          </>
        ) : null}
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
    <article className="overflow-hidden rounded-lg border border-preview-line bg-white text-preview-ink">
      <header className="flex items-start gap-2 p-3 pb-2">
        <AccountAvatar account={account} size={46} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-5">
            {displayName}
          </p>
          <p className="truncate text-xs leading-4 text-preview-muted">
            @{account.username}
          </p>
          <p className="flex items-center gap-1 text-xs text-preview-muted">
            Now · <Glyph icon={Integration} size={12} />
          </p>
        </div>
        <Glyph icon={MoreHorizontal} size={22} />
      </header>
      <div className="px-3 pb-3">
        <p className="whitespace-pre-wrap break-words text-sm leading-5">
          {body || <span className="text-preview-muted">Your caption…</span>}
        </p>
        {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
      </div>
      {postKind !== "text" ? (
        <MediaFrame media={media} ratio="aspect-[1.91/1]" />
      ) : null}
      <div className="px-3 pt-2">
        <div className="grid grid-cols-4 border-t border-preview-line py-1 text-preview-muted">
          {(
            [
              [Like, "Like"],
              [Email, "Comment"],
              [Repeat, "Repost"],
              [PaperPlane, "Send"],
            ] as const
          ).map(([icon, label]) => (
            <span
              key={label}
              className="flex flex-wrap items-center justify-center gap-1 py-2 text-xs font-semibold"
            >
              <Glyph icon={icon} size={18} /> {label}
            </span>
          ))}
        </div>
        {firstComment ? (
          <p className="border-t border-preview-line py-2 text-xs">
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
    <article className="border-y border-preview-line bg-white px-4 py-3 text-preview-ink">
      <div className="flex items-start gap-2.5">
        <AccountAvatar account={account} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-1 text-sm leading-5">
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-1">
              <span className="max-w-full truncate font-bold">
                {displayName}
              </span>
              <span className="min-w-0 truncate text-preview-muted">
                @{account.username}
              </span>
              <span className="shrink-0 text-preview-muted">· now</span>
            </div>
            <span className="ml-auto shrink-0 text-preview-muted">
              <Glyph icon={MoreHorizontal} size={20} />
            </span>
          </div>
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm leading-5">
            {body || (
              <span className="text-preview-muted">What&apos;s happening?</span>
            )}
          </p>
          {postKind !== "text" ? (
            <div className="mt-3">
              <MediaFrame media={media} ratio="aspect-[16/9]" rounded mosaic />
            </div>
          ) : null}
          {referenceUrl ? <LinkPreview url={referenceUrl} /> : null}
          <div className="mt-3 flex items-center justify-between gap-2 text-preview-muted">
            <span className="flex items-center gap-1 text-xs">
              <Glyph icon={Email} size={18} />
              {firstComment ? "1" : ""}
            </span>
            <Glyph icon={Repeat} size={19} />
            <Glyph icon={Like} size={19} />
            <Glyph icon={Soundwave} size={19} />
            <span className="flex shrink-0 items-center gap-3">
              <Glyph icon={Bookmark} size={18} />
              <Glyph icon={Share} size={18} />
            </span>
          </div>
          {firstComment ? (
            <p className="mt-3 border-t border-preview-line pt-3 text-xs">
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
    <article className="bg-white text-preview-ink">
      <MediaFrame media={media} ratio="aspect-video" rounded />
      <div className="mt-3 flex items-start gap-2.5">
        <AccountAvatar account={account} size={36} />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-5">
            {videoTitle}
          </p>
          <p className="mt-1 truncate text-xs text-preview-muted">
            {displayName}
          </p>
          <p className="text-xs text-preview-muted">No views · just now</p>
        </div>
        <Glyph icon={MoreVertical} size={21} />
      </div>
    </article>
  );
}

type VerticalVariant = "facebook" | "instagram" | "tiktok" | "youtube";

const VERTICAL_CONFIG: Record<
  VerticalVariant,
  {
    accentClass: string;
    actionIcons: HoneyIcon[];
    actionLabels: string[];
    primaryAction?: string;
  }
> = {
  facebook: {
    accentClass: "bg-preview-facebook",
    actionIcons: [Like, Email, Share],
    actionLabels: ["Like", "Comment", "Share"],
  },
  instagram: {
    accentClass: "bg-white",
    actionIcons: [Like, Email, PaperPlane, MoreHorizontal],
    actionLabels: ["Like", "Comment", "Share", "More"],
  },
  tiktok: {
    accentClass: "bg-preview-tiktok",
    actionIcons: [Like, Email, Bookmark, Share],
    actionLabels: ["Like", "Comment", "Save", "Share"],
    primaryAction: "Follow",
  },
  youtube: {
    accentClass: "bg-preview-youtube",
    actionIcons: [Like, Dislike, Email, Share],
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
    <div className="mx-auto w-full max-w-[22rem] overflow-hidden rounded-xl bg-preview-fill">
      <div className="relative aspect-[9/16] overflow-hidden bg-preview-fill text-white">
        <RawMedia media={media} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/45" />
        {isStory ? (
          <>
            <div className="absolute inset-x-3 top-3">
              <div className="mb-2 flex gap-1">
                <span className="h-0.5 flex-1 rounded-full bg-white" />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold">
                <AccountAvatar account={account} size={30} />
                <span className="min-w-0 flex-1 truncate">
                  {account.username}
                </span>
                <span className="font-normal text-white/75">now</span>
                <Glyph icon={MoreHorizontal} size={20} />
              </div>
            </div>
            <div className="absolute inset-x-3 bottom-4 flex items-center gap-2">
              <span className="flex-1 rounded-full border border-white/80 px-4 py-2.5 text-xs text-white/90">
                Send message
              </span>
              <Glyph icon={Like} size={25} />
              <Glyph icon={PaperPlane} size={24} />
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-x-4 top-4 flex items-center justify-between text-base font-bold drop-shadow">
              <span>
                {variant === "tiktok"
                  ? "Following  ·  For You"
                  : variant === "youtube"
                    ? "Shorts"
                    : "Reels"}
              </span>
              <Glyph
                icon={variant === "tiktok" ? Search : ImageAdd}
                size={23}
              />
            </div>
            <div className="absolute bottom-24 right-3 flex flex-col items-center gap-4">
              {variant === "tiktok" ? (
                <div className="relative mb-1">
                  <AccountAvatar account={account} size={38} />
                  {config.primaryAction ? (
                    <span
                      className={cn(
                        "absolute -bottom-2 left-1/2 flex size-4 -translate-x-1/2 items-center justify-center rounded-full text-xs font-bold text-white",
                        config.accentClass,
                      )}
                    >
                      +
                    </span>
                  ) : null}
                </div>
              ) : null}
              {config.actionIcons.map((ActionIcon, index) => (
                <span
                  key={config.actionLabels[index] ?? index}
                  className="flex flex-col items-center gap-0.5 text-xs font-medium drop-shadow"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center",
                      variant === "youtube" && "rounded-full bg-black/40",
                    )}
                  >
                    <Glyph icon={ActionIcon} size={24} />
                  </span>
                  {config.actionLabels[index]}
                </span>
              ))}
            </div>
            <div className="absolute inset-x-3 bottom-4 pr-12 text-xs drop-shadow">
              <div className="flex items-center gap-2">
                {variant !== "tiktok" ? (
                  <AccountAvatar account={account} size={30} />
                ) : null}
                <span className="min-w-0 truncate font-semibold">
                  @{account.username}
                </span>
                {config.primaryAction ? (
                  <span
                    className={cn(
                      "rounded px-2 py-0.5 text-xs font-semibold",
                      config.accentClass,
                    )}
                  >
                    {config.primaryAction}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap leading-4">
                {body || <span className="text-white/70">Your caption…</span>}
              </p>
              {referenceUrl ? (
                <p className="mt-1 truncate text-xs text-white/80">
                  {referenceUrl}
                </p>
              ) : null}
              <p className="mt-2 flex items-center gap-1 text-xs font-medium">
                <Glyph icon={Soundwave} size={14} /> Original audio ·{" "}
                {displayName}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function PlatformPostPreview(props: Props) {
  const displayName =
    props.account.displayName?.trim() || props.account.username;
  const previewProps = { ...props, displayName };
  const placement = props.platformSettings.placement;

  let preview: ReactNode;
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
      preview = <VerticalPreview {...previewProps} variant="tiktok" />;
      break;
    default:
      return null;
  }

  return (
    <figure
      aria-label={`${platformLabel(props.account.platform)} post preview`}
      className="w-full min-w-0 shrink-0 font-preview wrap-anywhere"
    >
      <PreviewHeading account={props.account} placement={placement} />
      {preview}
    </figure>
  );
}
