"use client";

import { useState } from "react";
import { ImageIcon, Plus, Trash2, PlayCircle, ExternalLink, AlertCircle } from "lucide-react";
import { extractYoutubeId } from "@/modules/spaces/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ─── Image gallery manager ─────────────────────────────────────────────────── */

type SpaceMediaManagerProps = {
  initialGalleryUrls?: string[];
  initialVideoLinks?: string[];
  mainImageUrl?: string | null;
  spaceName?: string;
};

function YoutubeThumb({ url, onRemove }: { url: string; onRemove: () => void }) {
  const videoId = extractYoutubeId(url);
  const thumb = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-muted/30">
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt="Thumbnail de YouTube"
          className="aspect-video w-full object-cover"
        />
      ) : (
        <div className="flex aspect-video items-center justify-center bg-muted">
          <PlayCircle className="h-8 w-8 text-muted-foreground/40" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
        <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground shadow transition-transform hover:scale-105"
            onClick={(e) => e.stopPropagation()}
            aria-label="Abrir en YouTube"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            onClick={onRemove}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow transition-transform hover:scale-105"
            aria-label="Eliminar enlace"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* YouTube badge */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5">
        <PlayCircle className="h-3 w-3 text-red-400" />
        <span className="text-[10px] font-medium text-white">YouTube</span>
      </div>
    </div>
  );
}

function GalleryImage({
  url,
  index,
  onRemove,
}: {
  url: string;
  index: number;
  onRemove: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Imagen de galería ${index + 1}`}
        className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-105"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/50">
        <button
          type="button"
          onClick={onRemove}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 shadow transition-all hover:scale-105 group-hover:opacity-100"
          aria-label="Eliminar imagen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function SpaceMediaManager({
  initialGalleryUrls = [],
  initialVideoLinks = [],
  mainImageUrl,
  spaceName,
}: SpaceMediaManagerProps) {
  const [galleryUrls, setGalleryUrls] = useState<string[]>(initialGalleryUrls);
  const [videoLinks, setVideoLinks] = useState<string[]>(initialVideoLinks);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  /* ─── Image handlers ──────────────────────────────────────────────────── */

  function addImageUrl() {
    setImageError(null);
    const trimmed = newImageUrl.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
    } catch {
      setImageError("La URL no es válida. Asegurate de incluir https://");
      return;
    }

    if (galleryUrls.includes(trimmed)) {
      setImageError("Esa imagen ya está en la galería.");
      return;
    }

    setGalleryUrls((prev) => [...prev, trimmed]);
    setNewImageUrl("");
  }

  function removeImage(index: number) {
    setGalleryUrls((prev) => prev.filter((_, i) => i !== index));
  }

  /* ─── Video handlers ──────────────────────────────────────────────────── */

  function addVideoLink() {
    setVideoError(null);
    const trimmed = newVideoUrl.trim();
    if (!trimmed) return;

    const isYoutube =
      trimmed.includes("youtube.com/watch") ||
      trimmed.includes("youtu.be/") ||
      trimmed.includes("youtube.com/shorts");

    if (!isYoutube) {
      setVideoError("Solo se permiten links de YouTube (youtube.com o youtu.be).");
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setVideoError("La URL no es válida.");
      return;
    }

    if (videoLinks.includes(trimmed)) {
      setVideoError("Ese video ya está en la lista.");
      return;
    }

    setVideoLinks((prev) => [...prev, trimmed]);
    setNewVideoUrl("");
  }

  function removeVideo(index: number) {
    setVideoLinks((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-8">
      {/* Hidden inputs — submitted with the form */}
      {galleryUrls.map((url) => (
        <input key={url} type="hidden" name="galleryUrls" value={url} />
      ))}
      {videoLinks.map((url) => (
        <input key={url} type="hidden" name="videoLinks" value={url} />
      ))}

      {/* ── Current main image ────────────────────────────────────────────── */}
      {mainImageUrl && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Imagen principal</p>
          <div className="overflow-hidden rounded-xl border border-border/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mainImageUrl}
              alt={`Imagen principal de ${spaceName ?? "este espacio"}`}
              className="aspect-video w-full object-cover"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <input
              type="checkbox"
              name="removeImage"
              className="h-4 w-4 rounded border-border"
              aria-label="Eliminar imagen actual"
            />
            Eliminar imagen actual
          </label>
        </div>
      )}

      {/* ── Upload new main image ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="imageFile">Subir imagen</Label>
        <Input
          id="imageFile"
          name="imageFile"
          type="file"
          aria-label="Subir imagen"
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
          className="cursor-pointer file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary hover:file:bg-primary/20"
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG, GIF, WEBP o SVG · Máximo 5 MB
        </p>
      </div>

      {/* ── Gallery images ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Galería de imágenes
            {galleryUrls.length > 0 && (
              <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                {galleryUrls.length}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Agregá URLs de imágenes adicionales del espacio (Supabase, Cloudinary, etc.).
          </p>
        </div>

        {galleryUrls.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {galleryUrls.map((url, idx) => (
              <GalleryImage
                key={`${url}-${idx}`}
                url={url}
                index={idx}
                onRemove={() => removeImage(idx)}
              />
            ))}
          </div>
        )}

        {galleryUrls.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 py-8">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No hay imágenes en la galería aún</p>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://... (URL de imagen)"
            value={newImageUrl}
            onChange={(e) => {
              setNewImageUrl(e.target.value);
              setImageError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addImageUrl();
              }
            }}
            className={cn(
              "flex-1",
              imageError && "border-destructive focus-visible:ring-destructive/30",
            )}
            aria-describedby={imageError ? "image-error" : undefined}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addImageUrl}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
        {imageError && (
          <p id="image-error" className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {imageError}
          </p>
        )}
      </div>

      {/* ── YouTube links ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            Videos de YouTube
            {videoLinks.length > 0 && (
              <span className="ml-2 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                {videoLinks.length}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Mostrá el espacio con videos de YouTube sin cargar nada al servidor.
          </p>
        </div>

        {videoLinks.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {videoLinks.map((url, idx) => (
              <YoutubeThumb
                key={`${url}-${idx}`}
                url={url}
                onRemove={() => removeVideo(idx)}
              />
            ))}
          </div>
        )}

        {videoLinks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 py-8">
            <PlayCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No hay videos de YouTube cargados</p>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={newVideoUrl}
            onChange={(e) => {
              setNewVideoUrl(e.target.value);
              setVideoError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addVideoLink();
              }
            }}
            className={cn(
              "flex-1",
              videoError && "border-destructive focus-visible:ring-destructive/30",
            )}
            aria-describedby={videoError ? "video-error" : undefined}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addVideoLink}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </Button>
        </div>
        {videoError && (
          <p id="video-error" className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {videoError}
          </p>
        )}
      </div>
    </div>
  );
}
