const GPS = {
  watchId: null, position: null, accuracy: null, callbacks: [], zones: new Map(), activeZones: new Set(), dwellTimers: {},
  startWatch(onUpdate) {
    if (onUpdate) this.callbacks.push(onUpdate);
    if (this.watchId !== null) return;
    if (!navigator.geolocation) return;
    this.watchId = navigator.geolocation.watchPosition(
      pos => { this.position = { lat: pos.coords.latitude, lng: pos.coords.longitude }; this.accuracy = pos.coords.accuracy; this.callbacks.forEach(cb => cb(this.position, this.accuracy)); this.checkZones(); },
      err => console.warn('GPS error:', err.message),
      { enableHighAccuracy: CONFIG.GPS.highAccuracy, maximumAge: CONFIG.GPS.maxAge, timeout: CONFIG.GPS.timeout }
    );
  },
  stopWatch() { if (this.watchId !== null) { navigator.geolocation.clearWatch(this.watchId); this.watchId = null; } },
  distance(lat1, lng1, lat2, lng2) {
    const R = 6371000, dLat = (lat2-lat1)*Math.PI/180, dLng = (lng2-lng1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },
  isNear(target, radius) { if (!this.position) return false; return this.distance(this.position.lat, this.position.lng, target.lat, target.lng) <= radius; },
  distanceTo(target) { if (!this.position) return Infinity; return this.distance(this.position.lat, this.position.lng, target.lat, target.lng); },
  registerZone(id, center, radius, onEnter, onExit) { this.zones.set(id, { center, radius, onEnter, onExit }); },
  checkZones() {
    if (!this.position) return;
    this.zones.forEach((zone, id) => {
      const inside = this.isNear(zone.center, zone.radius), wasInside = this.activeZones.has(id);
      if (inside && !wasInside) { this.activeZones.add(id); this.dwellTimers[id] = Date.now(); if (zone.onEnter) zone.onEnter(id); }
      else if (!inside && wasInside) { this.activeZones.delete(id); delete this.dwellTimers[id]; if (zone.onExit) zone.onExit(id); }
    });
  },
  isInZone(id) { return this.activeZones.has(id); },
  getDwellTime(id) { return this.dwellTimers[id] ? (Date.now() - this.dwellTimers[id]) / 1000 : 0; },
  isAccurate() { return this.accuracy !== null && this.accuracy <= CONFIG.GPS.accuracyThreshold; },
  formatDistance(m) { return m < 1000 ? Math.round(m) + 'm' : (m/1000).toFixed(1) + 'km'; }
};
