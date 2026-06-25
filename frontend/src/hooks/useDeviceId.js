import { useEffect } from 'react';

const STORAGE_KEY = 'escuela_padres_device_id';

export function obtenerDeviceId() {
  let deviceId = localStorage.getItem(STORAGE_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, deviceId);
  }
  return deviceId;
}

export function useDeviceId() {
  useEffect(() => {
    obtenerDeviceId();
  }, []);
}
