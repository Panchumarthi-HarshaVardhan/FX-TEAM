import axios from 'axios';

export const uploadToCloudinary = async (
  file,
  folder = 'founderx/uploads',
  onProgress
) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const uploadToBackend = async () => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    const res = await axios.post(
      `${API_URL}/api/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : ''
        },
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      }
    );

    return {
      url: res.data.url,
      type: res.data.type,
      duration: 0,
      format: ''
    };
  };

  if (!cloudName || !uploadPreset) {
    console.warn('Cloudinary configuration missing on frontend. Falling back to backend uploading...');
    return uploadToBackend();
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', folder);

  try {
    const res = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (event) => {
          if (!onProgress || !event.total) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        }
      }
    );

    const data = res.data;
    return {
      url: data.secure_url,
      type: data.resource_type, // 'image' or 'video'
      duration: data.duration, // Video duration in seconds (if video)
      format: data.format
    };
  } catch (error) {
    console.error('Cloudinary Direct Upload failed, falling back to backend upload:', error);
    try {
      return await uploadToBackend();
    } catch (backendError) {
      console.error('Backend Upload fallback also failed:', backendError);
      if (error.response && error.response.data && error.response.data.error) {
        throw new Error(error.response.data.error.message || 'Upload failed');
      }
      throw error;
    }
  }
};
