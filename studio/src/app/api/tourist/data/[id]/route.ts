import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return NextResponse.json({ message: 'Authorization header is missing' }, { status: 401 });
  }

  // The backend API URL from environment variables
  const backendApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8085/api';
  const backendUrl = `${backendApiUrl}/tourist/data/${id}`;

  try {
    // Forward the request to the Go backend, passing the Authorization header
    const response = await axios.get(backendUrl, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Return the response from the backend to the client
    return NextResponse.json(response.data, { status: response.status });
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      // Forward the error response from the backend
      return NextResponse.json(
        { message: error.response.data.message || 'An error occurred on the backend' },
        { status: error.response.status }
      );
    }
    // Handle non-Axios errors or cases where there's no response
    console.error('Proxy error:', error);
    return NextResponse.json({ message: 'Internal Server Error in proxy' }, { status: 500 });
  }
}
