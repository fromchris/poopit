// Thin wrapper over expo-image-picker → /api/uploads multipart POST.
// Mirrors the web's <MediaPicker/> + /api/uploads contract exactly:
// returns { url, kind, mime, bytes, name }.

import * as ImagePicker from "expo-image-picker";
import { backendUrl } from "./api";

export type UploadedMedia = {
  url: string;
  kind: "image" | "video";
  mime: string;
  bytes: number;
  name: string;
};

export async function pickMedia(
  kind: "image" | "video",
): Promise<ImagePicker.ImagePickerAsset | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes:
      kind === "image"
        ? ImagePicker.MediaTypeOptions.Images
        : ImagePicker.MediaTypeOptions.Videos,
    quality: 0.8,
    videoMaxDuration: 30,
  });
  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}

export async function uploadAsset(
  asset: ImagePicker.ImagePickerAsset,
): Promise<UploadedMedia> {
  const base = backendUrl();
  if (!base) throw new Error("EXPO_PUBLIC_BACKEND_URL is not set");

  const mime =
    asset.mimeType ??
    (asset.type === "video" ? "video/mp4" : "image/jpeg");
  const name =
    asset.fileName ??
    (asset.type === "video" ? `upload-${Date.now()}.mp4` : `upload-${Date.now()}.jpg`);

  const fd = new FormData();
  // RN's FormData accepts { uri, name, type } for files.
  fd.append("file", {
    uri: asset.uri,
    name,
    type: mime,
  } as unknown as Blob);

  const res = await fetch(`${base}/api/uploads`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  return (await res.json()) as UploadedMedia;
}
