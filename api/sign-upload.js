const cloudinary = require('cloudinary').v2;

module.exports = function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  cloudinary.config({
    cloud_name: process.env.VITE_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const { folder } = req.body;
  const timestamp = Math.round(Date.now() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({ 
    timestamp, 
    signature, 
    api_key: process.env.CLOUDINARY_API_KEY
  });
};