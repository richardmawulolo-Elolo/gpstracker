import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

interface TrackerMapProps {
  patientLocation: { latitude: number; longitude: number };
  homeLocation: { latitude: number; longitude: number };
  isWandering: boolean;
  hasSOS: boolean;
  hasFall: boolean;
  batteryLevel: number;
  colors: any;
  patientName: string;
  setScrollEnabled: (enabled: boolean) => void;
  landmarks: { name: string; lat: number; lng: number }[];
  caretakerLocation?: { latitude: number; longitude: number } | null;
}

export default function TrackerMap({
  patientLocation,
  homeLocation,
  isWandering,
  hasSOS,
  hasFall,
  batteryLevel,
  colors,
  patientName,
  landmarks,
  caretakerLocation,
}: TrackerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<any>(null);
  const patientMarkerRef = useRef<any>(null);
  const geofenceCircleRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const caretakerMarkerRef = useRef<any>(null);

  // 1. Dynamic CSS Link Injection & Leaflet Dynamic Import
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Inject CSS
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamic import to prevent SSR compilation errors in Node.js
    import('leaflet').then((LeafletModule) => {
      const L = LeafletModule.default || LeafletModule;
      LRef.current = L;

      if (!leafletMapRef.current && mapContainerRef.current) {
        // Create Map centered on Winneba Ghana center
        const map = L.map(mapContainerRef.current).setView([5.3520, -0.6230], 15);
        leafletMapRef.current = map;

        // Add CartoDB Voyager tile layer (does not block mobile user-agents)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
        }).addTo(map);

        // Home Base Marker (Primary Color icon)
        const homeIconHtml = `
          <div style="background-color: ${colors.primary}; width: 30px; height: 30px; border-radius: 15px; display: flex; justify-content: center; align-items: center; border: 2.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.25); color: white;">
            <span style="font-size: 14px; font-weight: bold; font-family: system-ui;">🏠</span>
          </div>
        `;
        L.marker([homeLocation.latitude, homeLocation.longitude], {
          icon: L.divIcon({
            html: homeIconHtml,
            className: 'leaflet-custom-home-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          })
        }).addTo(map).bindPopup("Home (Safe Zone Center)");

        // Safe Zone Boundary Circle (Dashed)
        const circleColor = isWandering ? colors.danger : colors.success;
        const geofence = L.circle([homeLocation.latitude, homeLocation.longitude], {
          radius: 300,
          color: circleColor,
          weight: 2,
          fillColor: circleColor,
          fillOpacity: 0.08,
          dashArray: '6, 6',
        }).addTo(map);
        geofenceCircleRef.current = geofence;

        // Landmarks Markers (Winneba UI tags)
        landmarks.forEach((l) => {
          const landmarkIconHtml = `
            <div style="display: flex; flex-direction: row; align-items: center;">
              <div style="background-color: #64748B; width: 8px; height: 8px; border-radius: 4px; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>
              <div style="background-color: rgba(255, 255, 255, 0.9); padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; color: #475569; margin-left: 5px; white-space: nowrap; border: 1px solid #CBD5E1; box-shadow: 0 1px 2px rgba(0,0,0,0.05); font-family: system-ui;">
                ${l.name}
              </div>
            </div>
          `;
          L.marker([l.lat, l.lng], {
            icon: L.divIcon({
              html: landmarkIconHtml,
              className: 'leaflet-landmark-icon',
              iconSize: [120, 20],
              iconAnchor: [4, 10],
            })
          }).addTo(map).bindPopup(l.name);
        });

        // Patient Active Marker (Dynamic Icon with status color & battery)
        const isEmergency = isWandering || hasSOS || hasFall;
        const statusColor = isEmergency ? colors.danger : colors.primary;
        const patientIconHtml = `
          <div style="background-color: ${statusColor}; padding: 6px 10px; border-radius: 14px; border: 1.5px solid white; color: white; font-weight: 800; font-size: 10px; font-family: system-ui; white-space: nowrap; display: flex; align-items: center; box-shadow: 0 3px 6px rgba(0,0,0,0.25);">
            <span style="margin-right: 4px;">👤</span> ${patientName} <span style="margin-left: 6px; font-weight: 400; opacity: 0.9;">🔋 ${batteryLevel >= 0 ? batteryLevel + '%' : 'N/A'}</span>
          </div>
        `;
        const patientMarker = L.marker([patientLocation.latitude, patientLocation.longitude], {
          icon: L.divIcon({
            html: patientIconHtml,
            className: 'leaflet-patient-icon',
            iconAnchor: [35, 13],
          })
        }).addTo(map);
        patientMarkerRef.current = patientMarker;

        // Caretaker blue dot marker
        if (caretakerLocation) {
          const caretakerIconHtml = `
            <div style="width: 24px; height: 24px; border-radius: 12px; background-color: rgba(59, 130, 246, 0.25); display: flex; justify-content: center; align-items: center;">
              <div style="width: 14px; height: 14px; border-radius: 7px; background-color: #3B82F6; border: 2.5px solid white; box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);"></div>
            </div>
          `;
          const caretakerMarker = L.marker([caretakerLocation.latitude, caretakerLocation.longitude], {
            icon: L.divIcon({
              html: caretakerIconHtml,
              className: 'leaflet-caretaker-icon',
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })
          }).addTo(map).bindPopup('You (Caretaker)');
          caretakerMarkerRef.current = caretakerMarker;
        }
      }
    });

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 3. Dynamic Updates for Location & Geofence triggers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (leafletMapRef.current && patientMarkerRef.current && LRef.current) {
      const L = LRef.current;
      // Update coordinates
      patientMarkerRef.current.setLatLng([patientLocation.latitude, patientLocation.longitude]);

      // Update patient marker icon styles dynamically based on emergency/battery state
      const isEmergency = isWandering || hasSOS || hasFall;
      const statusColor = isEmergency ? colors.danger : colors.primary;
      const patientIconHtml = `
        <div style="background-color: ${statusColor}; padding: 6px 10px; border-radius: 14px; border: 1.5px solid white; color: white; font-weight: 800; font-size: 10px; font-family: system-ui; white-space: nowrap; display: flex; align-items: center; box-shadow: 0 3px 6px rgba(0,0,0,0.25);">
          <span style="margin-right: 4px;">👤</span> ${patientName} <span style="margin-left: 6px; font-weight: 400; opacity: 0.9;">🔋 ${batteryLevel}%</span>
        </div>
      `;
      patientMarkerRef.current.setIcon(L.divIcon({
        html: patientIconHtml,
        className: 'leaflet-patient-icon',
        iconAnchor: [35, 13],
      }));
    }

    if (leafletMapRef.current && geofenceCircleRef.current) {
      // Update circle color dynamically based on geofence violations
      const circleColor = isWandering ? colors.danger : colors.success;
      geofenceCircleRef.current.setStyle({
        color: circleColor,
        fillColor: circleColor,
      });
    }

    // Update caretaker marker position
    if (leafletMapRef.current && caretakerMarkerRef.current && caretakerLocation) {
      caretakerMarkerRef.current.setLatLng([caretakerLocation.latitude, caretakerLocation.longitude]);
    } else if (leafletMapRef.current && !caretakerMarkerRef.current && caretakerLocation && LRef.current) {
      const L = LRef.current;
      const caretakerIconHtml = `
        <div style="width: 24px; height: 24px; border-radius: 12px; background-color: rgba(59, 130, 246, 0.25); display: flex; justify-content: center; align-items: center;">
          <div style="width: 14px; height: 14px; border-radius: 7px; background-color: #3B82F6; border: 2.5px solid white; box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);"></div>
        </div>
      `;
      const caretakerMarker = L.marker([caretakerLocation.latitude, caretakerLocation.longitude], {
        icon: L.divIcon({
          html: caretakerIconHtml,
          className: 'leaflet-caretaker-icon',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        })
      }).addTo(leafletMapRef.current).bindPopup('You (Caretaker)');
      caretakerMarkerRef.current = caretakerMarker;
    }
  }, [patientLocation, isWandering, hasSOS, hasFall, batteryLevel, colors.danger, colors.primary, colors.success, patientName, caretakerLocation]);

  return (
    <View style={styles.webMap}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webMap: {
    flex: 1,
    backgroundColor: '#E0F2FE',
    position: 'relative',
    overflow: 'hidden',
  },
});
