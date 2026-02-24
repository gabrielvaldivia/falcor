export function requestBrowserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=14`);
          if (!resp.ok) { resolve(null); return; }
          const data = await resp.json();
          const addr = data.address || {};
          const place = addr.borough || addr.suburb || addr.neighbourhood || addr.city || addr.town || addr.village || addr.municipality || "";
          const country = addr.country || "";
          const location = place && country ? `${place}, ${country}` : country || null;
          resolve(location);
        } catch { resolve(null); }
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 30000, maximumAge: 300000 }
    );
  });
}

export async function fetchLocation() {
  if (localStorage.getItem("falcor_geo_enabled") === "true") {
    const loc = await requestBrowserLocation();
    if (loc) return loc;
  }
  try {
    const resp = await fetch("https://ipapi.co/json/");
    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.region && data.country_name) return data.region + ", " + data.country_name;
    if (data.country_name) return data.country_name;
    return null;
  } catch {
    return null;
  }
}
