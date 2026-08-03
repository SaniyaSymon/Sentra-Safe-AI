import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeDivIcon = (color, label) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:${color};color:white;width:34px;height:34px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,0.2);border:2px solid white"><span style="transform:rotate(45deg)">${label}</span></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const ICONS = {
  shelter: makeDivIcon('#0D9488', 'S'),
  hospital: makeDivIcon('#E11D48', 'H'),
  college: makeDivIcon('#FF5A1F', 'C'),
  citizen: makeDivIcon('#0F172A', 'U'),
  sos: makeDivIcon('#DC2626', '!'),
};

function Recenter({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 12, { duration: 0.8 }); }, [center, map]);
  return null;
}

export default function LiveMap({
  center = [11.0, 78.0],
  userLocation,
  shelters = [], hospitals = [], colleges = [], hazards = [], incidents = [], riskDistricts = [],
  routeTo = null,
  onSelectResource,
  height = '480px',
}) {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    if (routeTo && userLocation) {
      setRoute([userLocation, [routeTo.latitude, routeTo.longitude]]);
    } else {
      setRoute(null);
    }
  }, [routeTo, userLocation]);

  const riskColor = (score) => score >= 8 ? '#DC2626' : score >= 6 ? '#F97316' : score >= 3.5 ? '#F59E0B' : '#10B981';

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm" data-testid="live-map">
      <MapContainer center={center} zoom={11} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Recenter center={center} />
        {riskDistricts.map((r, i) => (
          <CircleMarker key={`risk-${i}`} center={[r.latitude, r.longitude]}
            radius={12 + r.risk_score * 3}
            pathOptions={{ color: riskColor(r.risk_score), fillColor: riskColor(r.risk_score), fillOpacity: 0.18, weight: 1 }}>
            <Popup>
              <b>{r.district}, {r.state}</b><br/>
              Risk score: <b>{r.risk_score}/10</b> ({r.risk_level})<br/>
              Rainfall: {r.rainfall_mm} mm • Slope: {r.slope_movement_mm} mm<br/>
              Hazards: {r.hazard_types.join(', ') || 'n/a'} • SOS(48h): {r.sos_count}
            </Popup>
          </CircleMarker>
        ))}
        {userLocation && (
          <Marker position={userLocation} icon={ICONS.citizen}><Popup>Your location</Popup></Marker>
        )}
        {hazards.map(h => (
          <CircleMarker key={h.id} center={[h.latitude, h.longitude]}
            radius={22} pathOptions={{ color: h.risk_level === 'severe' ? '#DC2626' : h.risk_level === 'high' ? '#F97316' : '#F59E0B', fillOpacity: 0.15 }}>
            <Popup><b>{h.name}</b><br/>{h.hazard_type} • {h.risk_level}</Popup>
          </CircleMarker>
        ))}
        {shelters.map(s => (
          <Marker key={s.id} position={[s.latitude, s.longitude]} icon={ICONS.shelter} eventHandlers={{ click: () => onSelectResource?.(s, 'shelter') }}>
            <Popup>
              <b>{s.shelter_name}</b><br/>
              Capacity: {s.max_capacity - s.occupied_spots}/{s.max_capacity}<br/>
              <span className="text-xs">{s.address}</span>
            </Popup>
          </Marker>
        ))}
        {hospitals.map(h => (
          <Marker key={h.id} position={[h.latitude, h.longitude]} icon={ICONS.hospital} eventHandlers={{ click: () => onSelectResource?.(h, 'hospital') }}>
            <Popup>
              <b>{h.hospital_name}</b><br/>
              Beds available: {h.available_beds}/{h.bed_capacity}<br/>
              <span className="text-xs">{h.address}</span>
            </Popup>
          </Marker>
        ))}
        {colleges.map(c => (
          <Marker key={c.id} position={[c.latitude, c.longitude]} icon={ICONS.college} eventHandlers={{ click: () => onSelectResource?.(c, 'college') }}>
            <Popup>
              <b>{c.college_name}</b><br/>
              {c.college_type}<br/>
              <span className="text-xs">{c.address}</span>
            </Popup>
          </Marker>
        ))}
        {incidents.map(i => (
          <Marker key={i.id} position={[i.latitude, i.longitude]} icon={ICONS.sos}>
            <Popup>
              <b>SOS: {i.citizen_name}</b><br/>
              {i.hazard_type} • {i.status}<br/>
              {i.district}, {i.state}
            </Popup>
          </Marker>
        ))}
        {route && <Polyline positions={route} pathOptions={{ color: '#FF5A1F', weight: 4, dashArray: '8 6' }} />}
      </MapContainer>
    </div>
  );
}
