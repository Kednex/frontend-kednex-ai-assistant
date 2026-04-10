/**
 * Converts a File object to a base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

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
