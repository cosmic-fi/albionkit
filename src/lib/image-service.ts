
export const uploadImage = async (file: File): Promise<string | null> => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // Ideally this should be in an environment variable
    // NEXT_PUBLIC_IMGBB_API_KEY
    const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
    
    if (!apiKey) {
      console.error('ImgBB API Key is missing');
      return null;
    }

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      return data.data.url;
    } else {
      console.error('ImgBB Upload Error:', data);
      return null;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};
