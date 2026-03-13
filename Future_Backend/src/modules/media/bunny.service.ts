import crypto from "crypto";

const BUNNY_CONFIG = {
  libraryId: process.env.BUNNY_LIBRARY_ID!,
  apiKey: process.env.BUNNY_API_KEY!,
  hostname: process.env.BUNNY_HOSTNAME!,
  tokenAuthKey: process.env.BUNNY_TOKEN_KEY!,
  tokenExpiry: 60 * 60
};

// ==================== UPLOAD VIDEO ====================

export async function uploadVideoToBunny(
  videoBuffer: Buffer,
  fileName: string,
  title: string
): Promise<{ videoId: string; thumbnailUrl: string }> {

  // 1️⃣ Create video object
  const createRes = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_CONFIG.libraryId}/videos`,
    {
      method: "POST",
      headers: {
        AccessKey: BUNNY_CONFIG.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    }
  );

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error("Bunny create error: " + err);
  }

  const { guid: videoId } = (await createRes.json()) as { guid: string };

  // 2️⃣ Upload video binary

  const uploadRes = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_CONFIG.libraryId}/videos/${videoId}`,
    {
      method: "PUT",
      headers: {
        AccessKey: BUNNY_CONFIG.apiKey,
        "Content-Type": "application/octet-stream",
      },

      // مهم لنود
      body: new Uint8Array(videoBuffer),

      duplex: "half" as any
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error("Bunny upload error: " + err);
  }

  const thumbnailUrl =
    `https://${BUNNY_CONFIG.hostname}/${videoId}/thumbnail.jpg`;

  return { videoId, thumbnailUrl };
}

// ==================== GENERATE SIGNED STREAM ====================

export function generateSecureVideoUrl(
  videoId: string,
  userId: string,
  options: {
    expiresInSeconds?: number;
    userIp?: string;
  } = {}
) {

  const expiresIn = options.expiresInSeconds ?? BUNNY_CONFIG.tokenExpiry;

  const expirationTime = Math.floor(Date.now() / 1000) + expiresIn;

  const videoPath = `/${videoId}/play`;

  const hashable =
    BUNNY_CONFIG.tokenAuthKey +
    videoPath +
    expirationTime +
    (options.userIp || "");

  const token = crypto
    .createHash("sha256")
    .update(hashable)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const url =
    `https://${BUNNY_CONFIG.hostname}${videoPath}` +
    `?token=${token}&expires=${expirationTime}` +
    (options.userIp ? `&token_ip=${options.userIp}` : "");

  return {
    url,
    expiresAt: new Date(expirationTime * 1000),
  };
}

// ==================== VIDEO STATUS ====================

export async function getVideoStatus(videoId: string) {

  const res = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_CONFIG.libraryId}/videos/${videoId}`,
    {
      headers: {
        AccessKey: BUNNY_CONFIG.apiKey
      }
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  // 🔴 التصحيح هنا: تحويل نوع الداتا لـ any عشان نتجاوز خطأ unknown
  const data: any = await res.json();

  // 🔴 التصحيح هنا: تعريف نوع الماب عشان يقبل البحث جواه بأي قيمة
  const statusMap: Record<string, string> = {
    "0": "queued",
    "1": "processing",
    "2": "encoding",
    "3": "finished",
    "4": "error"
  };

  return {
    // 🔴 التصحيح هنا: تحويل الـ status لـ نص عشان يطابق الـ Record
    status: statusMap[String(data.status)] || "error",
    storageSize: data.storageSize,
    duration: data.length
  };
}

// ==================== DELETE VIDEO ====================

export async function deleteVideoFromBunny(videoId: string) {

  const res = await fetch(
    `https://video.bunnycdn.com/library/${BUNNY_CONFIG.libraryId}/videos/${videoId}`,
    {
      method: "DELETE",
      headers: {
        AccessKey: BUNNY_CONFIG.apiKey
      }
    }
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }
}

// ==================== EMBED URL ====================

export function getEmbedUrl(videoId: string) {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_CONFIG.libraryId}/${videoId}`;
}
