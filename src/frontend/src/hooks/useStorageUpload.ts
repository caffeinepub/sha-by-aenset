/**
 * Image upload hook that compresses images client-side.
 * Photos are stored in localStorage to avoid ICP message size limits.
 * Only a small key string is sent to the backend.
 */
export function useImageUpload() {
  const compressImage = async (
    file: File,
    maxSize = 300,
    quality = 0.6,
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let { width, height } = img;
          if (width > height) {
            if (width > maxSize) {
              height = Math.round((height * maxSize) / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round((width * maxSize) / height);
              height = maxSize;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Compress image and store it in localStorage.
   * Returns a short key string (not the base64) for backend storage.
   */
  const storePhoto = async (file: File): Promise<string> => {
    const base64 = await compressImage(file, 200, 0.5);
    const key = `sha_photo_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const tryStore = () => {
      localStorage.setItem(key, base64);
    };
    try {
      tryStore();
    } catch (e: unknown) {
      const isQuota =
        e instanceof DOMException &&
        (e.name === "QuotaExceededError" ||
          e.name === "NS_ERROR_DOM_QUOTA_REACHED");
      if (!isQuota) {
        // Unknown error — fall back to inline base64
        return base64;
      }
      // Evict oldest sha_photo_ entries until we have enough space
      try {
        const photoKeys = Object.keys(localStorage)
          .filter((k) => k.startsWith("sha_photo_"))
          .sort(); // keys contain timestamp so lexicographic = chronological
        for (const oldKey of photoKeys) {
          localStorage.removeItem(oldKey);
          try {
            tryStore();
            return key; // succeeded after eviction
          } catch {
            // still full, continue evicting
          }
        }
        // Could not free enough space — fall back to inline base64
        return base64;
      } catch {
        return base64;
      }
    }
    return key;
  };

  /**
   * Resolve a photo key or legacy base64 to a displayable src string.
   */
  const resolvePhoto = (key: string): string => {
    if (!key) return "";
    if (key.startsWith("data:")) return key; // legacy inline base64
    if (key.startsWith("sha_photo_")) {
      return localStorage.getItem(key) || "";
    }
    return key;
  };

  /**
   * Remove a stored photo from localStorage.
   */
  const deletePhoto = (key: string): void => {
    if (key?.startsWith("sha_photo_")) {
      localStorage.removeItem(key);
    }
  };

  return { compressImage, storePhoto, resolvePhoto, deletePhoto };
}
