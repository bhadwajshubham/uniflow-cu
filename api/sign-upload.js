import { v2 as cloudinary } from 'cloudinary';

export default function handler(req, res) {
  // CORS aur method check
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    cloudinary.config({
      cloud_name: process.env.VITE_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const { folder } = req.body;
    const timestamp = Math.round(Date.now() / 1000);

    // Signature generate karna
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    // Success response
    return res.status(200).json({ 
      timestamp, 
      signature, 
      api_key: process.env.CLOUDINARY_API_KEY 
    });
    
  } catch (error) {
    console.error("Cloudinary Signature Error:", error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}