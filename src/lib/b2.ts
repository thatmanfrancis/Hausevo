/**
 * Backblaze B2 Native API Utility
 * Uses standard fetch to interact with B2 without external SDKs.
 */

interface B2AuthResponse {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl: string;
  recommendedPartSize: number;
  absoluteMinimumPartSize: number;
  accountId: string;
}

interface B2UploadUrlResponse {
  bucketId: string;
  uploadUrl: string;
  authorizationToken: string;
}

/**
 * Authorizes the B2 account and returns the session data.
 */
async function authorizeAccount(): Promise<B2AuthResponse> {
  const id = process.env.B2_APPLICATION_KEY_ID;
  const key = process.env.B2_APPLICATION_KEY;

  if (!id || !key) {
    throw new Error("B2 credentials missing in environment variables.");
  }

  const credentials = Buffer.from(`${id}:${key}`).toString("base64");
  const res = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
    headers: {
      Authorization: `Basic ${credentials}`,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`B2 Authorization failed: ${error.message || res.statusText}`);
  }

  return res.json();
}

/**
 * Gets an upload URL and token for a specific bucket.
 */
export async function getB2UploadParams() {
  const auth = await authorizeAccount();
  const bucketName = process.env.B2_BUCKET_NAME;

  // First, get the bucket ID if we don't have it (we can cache this later)
  // For now, we'll assume the user might want to provide B2_BUCKET_ID directly
  // but let's implement a way to find it by name if only name is provided.
  
  let bucketId = process.env.B2_BUCKET_ID;

  if (!bucketId) {
    const bucketsRes = await fetch(`${auth.apiUrl}/b2api/v2/b2_list_buckets?accountId=${auth.accountId}`, {
      headers: { Authorization: auth.authorizationToken },
    });
    const { buckets } = await bucketsRes.json();
    const bucket = buckets.find((b: any) => b.bucketName === bucketName);
    if (!bucket) throw new Error(`Bucket ${bucketName} not found.`);
    bucketId = bucket.bucketId;
  }

  const res = await fetch(`${auth.apiUrl}/b2api/v2/b2_get_upload_url?bucketId=${bucketId}`, {
    headers: {
      Authorization: auth.authorizationToken,
    },
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to get B2 upload URL: ${error.message || res.statusText}`);
  }

  const uploadData: B2UploadUrlResponse = await res.json();

  return {
    uploadUrl: uploadData.uploadUrl,
    uploadToken: uploadData.authorizationToken,
    downloadUrl: auth.downloadUrl,
    bucketName: bucketName,
  };
}
