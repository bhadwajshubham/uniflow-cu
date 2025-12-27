import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../lib/firebase"; // Ensure this exports 'storage'
import imageCompression from 'browser-image-compression';

export const uploadEventPoster = async (file) => {
  if (!file) throw new Error("No file selected");

  // 1. Compression Settings (Target: ~100KB)
  const options = {
    maxSizeMB: 0.1, // 100KB
    maxWidthOrHeight: 1024, // HD Resolution (Good for phones)
    useWebWorker: true,
  };

  try {
    console.log(`Original Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 2. Compress
    const compressedFile = await imageCompression(file, options);
    console.log(`Compressed Size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

    // 3. Create Unique Path (events/timestamp_filename)
    const filename = `events/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filename);

    // 4. Upload
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // 5. Get Public URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;

  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};