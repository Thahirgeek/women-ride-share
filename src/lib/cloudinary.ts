import { v2 as cloudinary } from "cloudinary";

let isCloudinaryConfigured = false;

function configureCloudinary() {
  if (isCloudinaryConfigured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  isCloudinaryConfigured = true;
}

export async function uploadDriverVerificationDocument(params: {
  userId: string;
  documentType: string;
  file: File;
}) {
  configureCloudinary();

  const arrayBuffer = await params.file.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);
  const mimeType = params.file.type || "application/octet-stream";
  const dataUri = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

  const uploadResult = await cloudinary.uploader.upload(dataUri, {
    folder: `women-ride-share/driver-documents/${params.userId}`,
    resource_type: "auto",
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    tags: ["driver-verification", params.documentType.toLowerCase()],
  });

  return {
    storageUrl: uploadResult.secure_url,
    storagePublicId: uploadResult.public_id,
    originalFileName: params.file.name || null,
    mimeType,
    fileSizeBytes: params.file.size,
  };
}
