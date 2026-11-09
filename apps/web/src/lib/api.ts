import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const deviceUUID = localStorage.getItem('device_UUID');
    if (deviceUUID) {
      config.headers['x-device-uuid'] = deviceUUID;
    }
    const venueId = localStorage.getItem('current_venue_id');
    if (venueId) {
      config.headers['x-venue-id'] = venueId;
    }
  }
  return config;
});
