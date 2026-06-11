/**
 * EXIF-orientation handling for camera uploads.
 *
 * Phone cameras (notably iOS) store photos in the sensor's native landscape
 * pixel buffer and attach an EXIF `Orientation` tag describing how a viewer
 * should rotate them. Browsers honour that tag when *rendering* (so previews
 * look upright), but the raw bytes we base64-encode still carry sideways pixels
 * + the tag. Any downstream consumer that ignores EXIF (many server-side image
 * decoders and vision models) then sees a rotated image.
 *
 * To make every consumer agree, we bake the rotation into the pixels before
 * encoding and drop the now-redundant tag. We only re-encode when the tag
 * actually calls for a transform, so already-upright images (and non-JPEGs,
 * which don't carry this tag) pass through untouched at original quality.
 */

const ORIENTATION_NONE = 1;

/** Quality used when we must re-encode a re-oriented JPEG. */
const REENCODE_JPEG_QUALITY = 0.92;

/** EXIF lives near the start of the file; reading the head is enough. */
const EXIF_SCAN_BYTES = 128 * 1024;

const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

/**
 * Reads the EXIF `Orientation` value (1–8) from a JPEG. Returns 1 ("no
 * transform needed") for non-JPEGs, missing EXIF, or any parse failure.
 */
export const readExifOrientation = async (file: File): Promise<number> => {
    if (!/jpe?g/i.test(file.type)) return ORIENTATION_NONE;

    try {
        const buffer = await file.slice(0, EXIF_SCAN_BYTES).arrayBuffer();
        const view = new DataView(buffer);

        // Must start with the JPEG SOI marker.
        if (view.byteLength < 2 || view.getUint16(0, false) !== 0xffd8) {
            return ORIENTATION_NONE;
        }

        let offset = 2;
        while (offset + 4 <= view.byteLength) {
            const marker = view.getUint16(offset, false);

            // APP1 segment — the EXIF container.
            if (marker === 0xffe1) {
                const exifStart = offset + 4;
                // Confirm the "Exif" signature before trusting the payload.
                if (
                    exifStart + 6 > view.byteLength ||
                    view.getUint32(exifStart, false) !== 0x45786966 // "Exif"
                ) {
                    return ORIENTATION_NONE;
                }

                const tiffOffset = exifStart + 6;
                const little = view.getUint16(tiffOffset, false) === 0x4949; // "II"
                const firstIfd = view.getUint32(tiffOffset + 4, little);
                let dirOffset = tiffOffset + firstIfd;
                if (dirOffset + 2 > view.byteLength) return ORIENTATION_NONE;

                const entries = view.getUint16(dirOffset, little);
                dirOffset += 2;
                for (let i = 0; i < entries; i++) {
                    const entry = dirOffset + i * 12;
                    if (entry + 12 > view.byteLength) break;
                    if (view.getUint16(entry, little) === 0x0112) {
                        const value = view.getUint16(entry + 8, little);
                        return value >= 1 && value <= 8 ? value : ORIENTATION_NONE;
                    }
                }
                return ORIENTATION_NONE;
            }

            // Not a valid marker run — stop scanning.
            if ((marker & 0xff00) !== 0xff00) break;
            // Skip this segment using its declared length.
            offset += 2 + view.getUint16(offset + 2, false);
        }
    } catch {
        // Fall through to the safe default.
    }

    return ORIENTATION_NONE;
};

/**
 * Converts a file to a base64 data URL, baking EXIF orientation into the pixels
 * so the encoded bytes display the same way everywhere. Falls back to a plain,
 * unmodified read for non-JPEGs, already-upright images, unsupported
 * environments, or any error — uploads always succeed.
 */
export const fileToBase64 = async (file: File): Promise<string> => {
    try {
        const orientation = await readExifOrientation(file);
        if (orientation <= ORIENTATION_NONE) return readFileAsDataURL(file);

        const canDraw =
            typeof createImageBitmap === "function" &&
            typeof document !== "undefined";
        if (!canDraw) return readFileAsDataURL(file);

        // `from-image` returns a bitmap already rotated to display orientation
        // with width/height swapped as needed — drawing it yields upright pixels
        // and the export drops the EXIF tag entirely.
        const bitmap = await createImageBitmap(file, {
            imageOrientation: "from-image",
        });

        try {
            const canvas = document.createElement("canvas");
            canvas.width = bitmap.width;
            canvas.height = bitmap.height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return readFileAsDataURL(file);

            ctx.drawImage(bitmap, 0, 0);
            return canvas.toDataURL("image/jpeg", REENCODE_JPEG_QUALITY);
        } finally {
            bitmap.close();
        }
    } catch {
        return readFileAsDataURL(file);
    }
};
