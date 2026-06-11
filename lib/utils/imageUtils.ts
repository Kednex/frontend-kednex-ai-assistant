import { fileToBase64 } from "./imageOrientation";

/**
 * Converts a File object to a base64 string.
 *
 * Normalizes EXIF orientation so camera photos (portrait shots in particular)
 * encode as upright pixels for every downstream consumer. See
 * {@link ./imageOrientation} for details.
 */
export { fileToBase64 };

/**
 * Converts multiple files to base64 strings
 */
export const filesToBase64 = async (files: File[]): Promise<string[]> => {
    return Promise.all(files.map((file) => fileToBase64(file)));
};

/**
 * Creates preview URLs for files
 */
export const createPreviewUrls = (files: File[]): string[] => {
    return files.map((file) => URL.createObjectURL(file));
};

/**
 * Revokes blob URLs to free up memory
 */
export const revokeBlobUrl = (url: string): void => {
    if (typeof url === "string" && url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
    }
};

/**
 * Revokes multiple blob URLs
 */
export const revokeBlobUrls = (urls: string[]): void => {
    urls.forEach(revokeBlobUrl);
};
