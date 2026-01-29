import axios from 'axios';

const axiosInstance = axios.create({
  // We no longer need a global baseURL as we will call the Next.js proxy route.
  headers: {
    'Content-Type': 'application/json',
  },
});

export const registerTourist = async (data: any): Promise<{ success: boolean; qrCodeUrl?: string; message?: string }> => {
  try {
    const response = await axios.post(process.env.NEXT_PUBLIC_API_URL + '/tourist/register', data, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'image/png', 
      },
    });

    if (response.status !== 200) {
      throw new Error('Failed to register tourist');
    }
    
    const imageBuffer = Buffer.from(response.data, 'binary');
    const qrCodeUrl = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    return { success: true, qrCodeUrl };

  } catch (error) {
     if (axios.isAxiosError(error) && error.response) {
      try {
        const errorData = JSON.parse(Buffer.from(error.response.data).toString('utf-8'));
        return { success: false, message: errorData.message || 'An error occurred during registration.' };
      } catch (e) {
        return { success: false, message: error.response.statusText || 'An unknown error occurred' };
      }
    }
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during registration.';
    return { success: false, message };
  }
};

export const getTouristData = async (id: string, token: string): Promise<any | null> => {
  try {
    // Call the Next.js proxy route instead of the external backend directly.
    const response = await axiosInstance.get(`/api/tourist/data/${id}`, {
      headers: {
        'Authorization': `Basic ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            console.error('Authorization failed.');
            throw new Error('Unauthorized: Please check your credentials.');
        }
         if (error.response?.status === 404) {
            console.error('Tourist not found');
            throw new Error('Tourist data not found for the provided ID.');
        }
    }
    console.error(`Failed to fetch tourist data for id ${id}:`, error);
    throw new Error('An unexpected error occurred while fetching tourist data.');
  }
};
