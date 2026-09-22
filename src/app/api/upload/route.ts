import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { blobEnabled, IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/uploads";

/** Issues short-lived tokens so signed-in users can upload images straight to Vercel Blob. */
export async function POST(request: Request) {
  if (!blobEnabled) return NextResponse.json({ error: "Blob storage not configured" }, { status: 501 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const user = await getCurrentUser();
        if (!user) throw new Error("Sign in to upload images");
        return {
          allowedContentTypes: Object.keys(IMAGE_TYPES),
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: user.id }),
        };
      },
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }
}
