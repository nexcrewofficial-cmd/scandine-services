'use client';

import { useState, useEffect } from 'react';

export const useDeviceId = (): string => {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('device_UUID');
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('device_UUID', id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
};
