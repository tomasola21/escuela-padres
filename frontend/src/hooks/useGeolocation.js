import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [ubicacion, setUbicacion] = useState(null);
  const [error, setError] = useState(null);
  const [solicitando, setSolicitando] = useState(false);

  const solicitarUbicacion = () => {
    if (!navigator.geolocation) {
      setError('La geolocalización no está disponible en este navegador.');
      return;
    }

    setSolicitando(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUbicacion({
          latitud: position.coords.latitude,
          longitud: position.coords.longitude
        });
        setError(null);
        setSolicitando(false);
      },
      (err) => {
        setError('No se pudo obtener la ubicación. Por favor, activa el GPS.');
        setSolicitando(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return { ubicacion, error, solicitando, solicitarUbicacion };
}
