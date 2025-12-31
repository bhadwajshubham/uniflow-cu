import axios from 'axios';

// ☁️ CLOUDINARY CONFIG
const CLOUD_NAME = "dt8pjvy7w"; 
const UPLOAD_PRESET = "uniflow_preset"; 

export const uploadImage = async (file) => {
  if (!file) return null;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', 'uniflow_uploads');

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      formData
    );
    return response.data.secure_url;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Image upload failed");
  }
};