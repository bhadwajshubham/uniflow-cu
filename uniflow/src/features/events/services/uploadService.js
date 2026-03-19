const CLOUD_NAME = import.meta.env.VITE_CLOUD_NAME;

export const uploadImage = async (file) => {
  if (!file) return null;

  // Get signature from server
  const { timestamp, signature, api_key } = await fetch('/api/sign-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder: 'uniflow_uploads' })
  }).then(r => r.json());

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', 'uniflow_uploads');
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('api_key', api_key);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url;
};