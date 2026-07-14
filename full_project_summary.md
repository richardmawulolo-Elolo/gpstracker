# GPS Dementia Tracker: Complete Project Summary

This document provides a comprehensive, detailed technical overview of everything designed, built, integrated, and fixed in the **GPS Dementia Tracker** application. It details the system architecture, component structures, mathematical formulas, state management, and edge-case fixes implemented from the project's inception to the current version.

---

## 1. Executive Summary & Project Overview

The **GPS Dementia Tracker** is a universal (Web, Android, iOS) application built using React Native and Expo. It is designed to assist caretakers in monitoring patients diagnosed with dementia or other cognitive impairments. 

### 1.1. Core Project Goals
- **Patient Safety**: Keep caretakers continuously informed of the patient's current geolocation.
- **Geofencing & Alerts**: Define safety boundaries around the patient's home and immediately trigger notifications when the patient wanders.
- **Accident Prevention**: Integrate automatic monitoring for falls and battery drainage.
- **Role-Based Workflows**: Separate the application into two distinct user roles:
  1. **Caretakers**, who require maps, dashboards, simulation engines, and warning feeds.
  2. **Patients**, who need a simplified, distraction-free interface showing active tracking states and a large SOS panic button.

---

## 2. Technology Stack & Installed Packages

The project uses Expo SDK 54, React Native, and Firebase as the database/auth backbone. The following libraries and packages are installed:

### 2.1. Core Dependencies (`package.json`)
*   **`expo`**: `~54.0.0` — Core universal framework SDK.
*   **`react`** / **`react-dom`**: `19.1.0` — Application rendering layer.
*   **`react-native`**: `0.81.5` — Cross-platform native rendering.
*   **`react-native-web`**: `^0.21.0` — Compiles React Native components to browser DOM elements.

### 2.2. Navigation & Utilities
*   **`expo-router`**: `~6.0.24` — File-based router mapping the file structure directly to routing pathways.
*   **`expo-constants`**: `~18.0.13` — Accesses system-level constants.
*   **`expo-linking`**: `~8.0.12` — Deep linking configuration.
*   **`expo-font`**: `~14.0.12` — Custom font loading.
*   **`expo-splash-screen`**: `~31.0.13` — Manages native splash screen load state.
*   **`expo-status-bar`**: `~3.0.9` — Controls status bar styling dynamically.
*   **`expo-system-ui`**: `~6.0.9` — Controls application system-level UI behaviors.

### 2.3. Location, Maps & Hardware API
*   **`expo-location`**: `~19.0.8` — Accesses device GPS hardware and handles position subscriptions.
*   **`expo-battery`**: `~10.0.8` — Subscribes to device battery status and remaining charge percentages.
*   **`expo-device`**: `~8.0.10` — Retrieves physical device hardware specifications.
*   **`react-native-maps`**: `1.20.1` — Native map rendering library (iOS and Android).
*   **`leaflet`**: `^1.9.4` — Web mapping library engine.
*   **`react-leaflet`**: `^5.0.0` — React components wrapper for Leaflet.
*   **`@types/leaflet`**: `^1.9.21` — TypeScript types support for Leaflet.

### 2.4. Styling & Animations
*   **`react-native-reanimated`**: `~4.1.1` — Native thread driver for fluid UI animations.
*   **`react-native-gesture-handler`**: `~2.28.0` — Direct swipe and gesture event handling.
*   **`react-native-screens`**: `~4.16.0` — Optimizes navigation load times by mapping views directly to native view controllers.
*   **`react-native-worklets`**: `0.5.1` — Enables high-performance, asynchronous execution of JS code on custom threads.
*   **`expo-image`**: `~3.0.11` — High-performance image loading component.

### 2.5. Developer Tooling
*   **`typescript`**: `~5.9.2` — Strict typing compilation.
*   **`eslint`**: `^9.0.0` — Linting analyzer.
*   **`eslint-config-expo`**: `~10.0.0` — Expo-configured linting rules.

---

## 3. Screen Architecture & Router Setup

The application employs a file-based router structure inside the `src/app` directory, utilizing Expo Router's Stack and Tabs layouts.

```mermaid
graph TD
    A[Root Layout: src/app/_layout.tsx] -->|Unauthenticated| B[Auth Group: src/app/auth/_layout.tsx]
    A -->|Authenticated| C[Tabs Group: src/app/\(tabs\)/_layout.tsx]
    
    B --> B1[Login: auth/login.tsx]
    B --> B2[Signup: auth/signup.tsx]
    
    C -->|Patient Role| D[Patient View: patient-home.tsx]
    C -->|Caretaker Role| E[Caretaker Views]
    
    E --> E1[Caretaker Map: index.tsx]
    E --> E2[Alerts Dashboard: alerts.tsx]
    E --> E3[Telemetry Logs: history.tsx]
    E --> E4[Patient Profile: profile.tsx]
```

### 3.1. Routing Registry
1.  **Root Layout** (`src/app/_layout.tsx`): Sets up context providers (`AuthProvider` and `TrackerProvider`) and manages root-level redirection using the React Router state listeners. If a user session is active, it routes to `/(tabs)`. If not, it redirects the viewport to `/auth/login`.
2.  **Auth Navigator** (`src/app/auth/_layout.tsx`): Declares a Stack navigator managing `/auth/login` and `/auth/signup` routes.
3.  **Auth: Login** (`src/app/auth/login.tsx`): Renders the credentials form, Google Auth popup triggers, error display banners, and styling configurations.
4.  **Auth: Create Account** (`src/app/auth/signup.tsx`): Prompts the user to select their role and registers their credentials, automatically setting up default database profiles.
5.  **Tabs Controller** (`src/app/(tabs)/_layout.tsx`): Standard bottom tab navigation. Reads user roles from the authentication state:
    *   **Patient Role**: Hides the tab bar (`display: 'none'`, `height: 0`) and points the default routing strictly to `/patient-home`.
    *   **Caretaker Role**: Shows a 4-tab bar (Map, Alerts, History, Profile) with a dynamic red notification badge displaying active alert counts.
6.  **Tab: Caretaker Map** (`src/app/(tabs)/index.tsx`): The main caretaker dashboard. Renders a full-screen map (web Leaflet or native Google Maps), a status banner, and the Caregiver Simulation Center grid.
7.  **Tab: Alert Center** (`src/app/(tabs)/alerts.tsx`): Lists active unresolved alerts, allows caregivers to dismiss them, and has a quick action to simulate a voice call to the primary caretaker.
8.  **Tab: Location History** (`src/app/(tabs)/history.tsx`): Displays a chronological list of location telemetry events showing coords, status (Safe/Outside Zone), timestamps, and total compliance statistics.
9.  **Tab: Patient Profile** (`src/app/(tabs)/profile.tsx`): Displays profile information (Avatar, Age, Condition, Safe Zone Radius, Connection Status) and provides a logout trigger.
10. **Tab: Patient Home Screen** (`src/app/(tabs)/patient-home.tsx`): Custom UI for patient-specific devices. Includes a pulsing circular indicator showing tracking status, an SOS panic button, coordinate sync controls, and a "Caregiver Has Arrived" cancel resolution option.

---

## 4. Role Selection & User Onboarding

When a new user signs up on `/auth/signup`, they must choose their role. The selection is stored in the database to manage the application workflow.

```
       I am a...
 ┌──────────────────────────────────────────────┐
 │ 👁️ Caretaker                                  │
 │ I want to monitor a patient's safety.        │
 └──────────────────────────────────────────────┘
 ┌──────────────────────────────────────────────┐
 │ ❤️ Patient / Family Setup                     │
 │ I am setting up this tracking device.        │
 └──────────────────────────────────────────────┘
```

### 4.1. Account Database Schema
Once details are submitted:
- A user account record is created in Firebase Auth.
- A user profile is written to the Firebase Realtime Database at `users/${uid}`:
  ```json
  {
    "email": "user@example.com",
    "role": "caretaker", // or "patient"
    "createdAt": "2026-07-08T18:49:17Z"
  }
  ```
- **If the user registers as a patient**, a patient data node is initialized at `patients/${uid}` to hold their tracking parameters:
  ```json
  {
    "name": "Patient",
    "location": {
      "latitude": 5.3520,
      "longitude": -0.6230
    },
    "isWandering": false,
    "hasFall": false,
    "hasSOS": false,
    "batteryLevel": 100,
    "signalStrength": "Excellent"
  }
  ```

---

## 5. Role-Based Navigation & Interface Separation

Role-based navigation controls are defined in `src/app/(tabs)/_layout.tsx` to keep the user experiences separate:

*   **Patient Devices**: Hiding the tab bar prevents cognitive overload and prevents patients from accidentally navigating to caretaker-only screens or clicking simulations.
*   **Safety Redirects**: If a caretaker tries to access `/patient-home`, they are redirected to the caretaker map. Conversely, if a patient attempts to open a caretaker tab, they are redirected back to the patient home view.
*   **Layout Definition**:
    ```typescript
    const isPatient = role === 'patient';
    // Inside TabLayout screenOptions
    tabBarStyle: {
      display: isPatient ? 'none' : 'flex',
      height: isPatient ? 0 : 64,
    }
    ```

---

## 6. GPS Location Tracking & Telemetry Setup

Location tracking is managed via `expo-location` inside `src/context/TrackerContext.tsx`.

### 6.1. Patient Client GPS Stream
When a user is logged in as a patient:
1.  **Permissions Request**: The app calls `Location.requestForegroundPermissionsAsync()`.
2.  **GPS Watch Service**: If permission is granted, a background listener watches device coordinates:
    ```typescript
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Sync every 5 seconds
        distanceInterval: 0,
      },
      (location) => {
        if (!isSimulatingRef.current) {
          const lat = location.coords.latitude;
          const lng = location.coords.longitude;
          
          // Calculate geofence, update DB node, write history entry
        }
      }
    );
    ```

### 6.2. Caretaker Client Map Pin
When logged in as a caretaker, the app activates a local GPS subscription (`watchPositionAsync` at `Accuracy.Balanced`) to place a blue dot representing the caretaker's location on the map. This local position is not written to the patient's database node, protecting caretaker privacy.

---

## 7. Geofencing System & the Haversine Formula

The geofence system calculates the distance between the patient's current location and their home location to determine if they are safe.

### 7.1. Geofence Configuration
- **Safe Zone Center**: `Winneba Home` (Latitude: `5.3520`, Longitude: `-0.6230`)
- **Safety Boundary**: 300 meters

### 7.2. The Haversine Formula
The geofence calculations use the Haversine formula, which computes the shortest distance between two points on a sphere using their latitudes and longitudes:

$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1) \cdot \cos(\phi_2) \cdot \sin^2\left(\frac{\Delta \lambda}{2}\right)$$

$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$

$$d = R \cdot c$$

Where:
*   $\phi$ is latitude in radians.
*   $\lambda$ is longitude in radians.
*   $R$ is the Earth's radius (6,371,000 meters).
*   $d$ is the calculated distance over the earth's surface.

### 7.3. Code Implementation
The geofence check is executed on every location update:

```typescript
const R = 6371e3; // Earth's radius in meters
const lat1 = lat * Math.PI / 180;
const lat2 = 5.3520 * Math.PI / 180;
const deltaLat = (5.3520 - lat) * Math.PI / 180;
const deltaLng = (-0.6230 - lng) * Math.PI / 180;

const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
  Math.cos(lat1) * Math.cos(lat2) *
  Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
const distance = R * c;

const isSafe = distance <= 300; // Geofence violation limit
```

*   **Safe State ($d \le 300$ meters)**: The database node flag `isWandering` is updated to `false`.
*   **Wandering State ($d > 300$ meters)**: The `isWandering` flag is updated to `true`, triggering a wandering alert.

---

## 8. Battery Monitoring & Telemetry Banners

The app monitors the patient's device battery level to ensure the tracking hardware remains active.

### 8.1. Native Battery Watcher
When logged in as a patient, the app queries the device battery state using `expo-battery`:
1.  On initialization, the app queries the current charge level:
    ```typescript
    const level = await Battery.getBatteryLevelAsync();
    ```
2.  The retrieved value (e.g., `0.78`) is converted to an integer percentage (`78%`) and written to the patient's database node.
3.  The app polls the battery level every 60 seconds to track changes.

### 8.2. Low Battery Warning
If the battery level falls below **20%**, the context triggers a low battery warning:
- The app sends a "Low Battery Warning" alert to the database.
- A flag ensures the alert is sent only once per discharge cycle. When the battery level rises above 20% again, the trigger resets.

### 8.3. Visual Styling & Color Coding
The UI displays the battery level using dynamic color coding:
- **Green (>50%)**: Sufficient charge.
- **Yellow (20% - 50%)**: Low charge.
- **Red (<20%)**: Critical warning.

---

## 9. Google Authentication Setup

Google Sign-In is configured for web browsers, providing single sign-on options alongside email credentials.

### 9.1. Auth Provider Setup (`src/config/auth.ts`)
```typescript
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
```

### 9.2. Sign-In Workflow
1.  **Login Screen Pop-Up**: Selecting "Continue with Google" opens the Firebase sign-in popup.
2.  **Role Verification**: 
    *   If the user has a stored profile in the database (`users/${uid}`), the app reads their role and logs them in.
    *   If the user does not have a profile, they are signed out, and the login screen displays an error prompting them to create an account first.
3.  **Onboarding Workflow**:
    *   To register with Google, the user must go to the Sign-Up screen, select a role, and click "Sign up with Google".
    *   The app registers the account and writes the selected role to the database, ensuring all users have an assigned role on onboarding.

---

## 10. Firebase Core Integration & Realtime Sync

Firebase acts as the central data store for the application, synchronizing states between the patient's tracking device and the caretaker's dashboard.

```
 [ Patient Device ]                                     [ Caretaker App ]
  - Location Updates   ────────>  [ Firebase ]  ────────>  - Map Pins
  - Battery/SOS States           Realtime DB                - Active Alerts Feed
                                                           - Telemetry Logs
```

### 10.1. Connection Setup (`src/config/firebase.ts`)
The application initializes Firebase using credentials for the database, storage, and authentication services:
- **Project ID**: `gps-dementia-tracker`
- **Realtime Database**: `https://gps-dementia-tracker-default-rtdb.firebaseio.com`

### 10.2. Realtime Database Subscriptions
- **Patient Listener**: In `TrackerContext.tsx`, caretakers subscribe to the `/patients` database node. Changes to location coordinates, battery levels, or safety states are reflected on the caretaker's map in real time.
- **Security Rules (`database.rules.json`)**:
  ```json
  {
    "rules": {
      "users": {
        "$uid": {
          ".read": "auth != null && auth.uid == $uid",
          ".write": "auth != null && auth.uid == $uid"
        }
      },
      "patients": {
        "$patientId": {
          ".read": "auth != null",
          ".write": "auth != null"
        }
      }
    }
  }
  ```

---

## 11. Alert System & Incident Types

The Alert Center processes safety-critical telemetry events. Active alerts are displayed on the caretaker's tab bar badge and dashboard.

### 11.1. Incident Registry

| Incident Type | Trigger Source | Database Flag | Priority | Badge Color & Icon | Message Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Wandering Alert** | Location update $> 300\text{m}$ | `isWandering = true` | High | Yellow Amber • `walk` | Kofi Mensah has wandered outside the home safe zone. |
| **SOS Alert** | Patient pressed panic button | `hasSOS = true` | Critical | Red • `notifications` | Kofi Mensah pressed the tracker SOS button. |
| **Fall Alert** | Sim center accelerometer hit | `hasFall = true` | Critical | Red • `body` | A hard impact was detected by Kofi Mensah's tracker. |
| **Low Battery** | Battery level $< 20\%$ | `batteryLevel < 20` | Warning | Orange • `battery` | Device battery is low. Please charge the tracker. |
| **Patient Safe** | Location returned to safe zone | `isWandering = false` | Info | Green • `shield-checkmark` | Kofi Mensah has returned to the home safe zone. |

### 11.2. Alert Actions
- **Locate on Map**: Selecting this option switches the tab view to the map, allowing caregivers to locate the patient.
- **Dismiss Alert**: Removes the selected alert from the active display.
- **Dismiss All**: Clears all unresolved alerts for the patient.

---

## 12. Telemetry History & Location Logging

The history log records all movement and telemetry events, providing a record of the patient's coordinates over time.

### 12.1. History Entry Schema
Each telemetry log includes:
- **`id`**: Unique timestamp key.
- **`locationName`**: Coordinates format (e.g., `Live: 5.3520, -0.6230`) or action indicator.
- **`time`**: Human-readable timestamp (HH:MM:SS).
- **`status`**: Safety flag (`safe`, `warning`, `danger`).
- **`coordinates`**: Precise location details.

### 12.2. Event Types
- **Live GPS Trace**: Automatic logs created when the patient's position changes.
- **Wandering Violations**: Logged when the patient crosses the geofence boundary.
- **Safety Resolution Markers**: Logged when an emergency is resolved ("Emergency Resolved (Patient Found)").

---

## 13. Patient Profile Configuration

The Patient Profile screen details the patient's medical and tracking status:

*   **Age**: 74
*   **Condition**: Moderate Dementia
*   **Safe Zone Radius**: 300 meters
*   **Connection Status**: Active Tracking (Green status badge)
*   **Primary Caregiver Details**: Displays the email address of the caretaker linked to the patient.
*   **Quick Call Action**: Simulates a phone call to the caretaker.

---

## 14. Simulation Control Center & Telemetry Controls

The Caregiver Simulation Center allows developers and caretakers to test alerts and geofencing behaviors.

```
 ┌──────────────────────────────────┐ ┌──────────────────────────────────┐
 │ 🚸 Simulate Wandering            │ │ 🏠 Return Home                   │
 │ Move patient outside geofence    │ │ Reset patient to safe zone       │
 └──────────────────────────────────┘ └──────────────────────────────────┘
 ┌──────────────────────────────────┐ ┌──────────────────────────────────┐
 │ 🚨 Trigger SOS                   │ │ ⚠️ Simulate Fall                  │
 │ Simulate distress button press   │ │ Trigger accelerometer alert      │
 └──────────────────────────────────┘ └──────────────────────────────────┘
```

1.  **Simulate Wandering**: Moves the patient's location to `WINNEBA_WANDER` (Latitude: `5.3645`, Longitude: `-0.6210`), which is approximately 1.4 kilometers from home. This violation triggers the geofence alarm and pushes a wandering alert.
2.  **Return Home**: Resets the patient's location to `WINNEBA_HOME` (Latitude: `5.3520`, Longitude: `-0.6230`). It clears the `isWandering`, `hasFall`, and `hasSOS` flags, and logs a "Patient Safe" status update.
3.  **Trigger SOS**: Simulates the patient pressing the SOS panic button, setting `hasSOS = true` and creating an emergency alarm.
4.  **Simulate Fall**: Simulates a fall event, setting `hasFall = true` and creating a fall alert.
5.  **Resolve / Caregiver Arrived**: Resets the emergency state, clearing the `isWandering`, `hasFall`, and `hasSOS` flags. It logs an "Emergency Resolved" status update in the history feed.

---

## 15. Map Setup for Browser & Mobile Environments

The application uses a cross-platform map system that supports both mobile screens and web browsers.

### 15.1. Mobile Mapping (`TrackerMap.tsx`)
On native mobile devices, the app renders maps using `react-native-maps`:
- **Engine**: Native Apple Maps (iOS) or Google Maps (Android).
- **Layer**: Custom CartoDB Voyager raster tiles (`UrlTile`) to maintain a clean, consistent design.
- **Markers**: Uses vector icons (`Ionicons`) inside circle containers for Home, Patient, and landmarks.
- **Geofence Circle**: Rendered using `<Circle>` with a dashed line pattern (`lineDashPattern={[6, 6]}`) that turns red during wandering alerts.

### 15.2. Web Mapping (`TrackerMap.web.tsx`)
On web browsers, the app uses Leaflet:
- **Engine**: Leaflet library initialized within a `mapContainer` reference.
- **Layer**: CartoDB Voyager tiles (`voyager`) with Carto attribution.
- **Markers**: Rendered using `L.divIcon` to build customized HTML markers containing patient details and battery levels.
- **Geofence Circle**: Rendered using `L.circle` with a dashed pattern (`dashArray: '6, 6'`) that updates colors dynamically based on safety states.

---

## 16. Bug Fixes, Workarounds & Engineering Resolutions

Several key bugs and edge cases were fixed during the development of the application:

### 16.1. Leaflet Node.js SSR Compilation Errors
*   **The Issue**: During build time, the Node.js compiler tried to process the Leaflet library. This caused build failures because Leaflet references `window` and `document`, which are not available in server environments.
*   **The Fix**: Leaflet is imported dynamically inside `useEffect` on the client side:
    ```typescript
    useEffect(() => {
      if (typeof window === 'undefined') return;
      import('leaflet').then((LeafletModule) => {
        const L = LeafletModule.default || LeafletModule;
        // Leaflet initialization code
      });
    }, []);
    ```

### 16.2. Web-to-Mobile CSS Asset Injection
*   **The Issue**: Importing Leaflet's stylesheet directly into `app.json` or `_layout.tsx` broke the mobile app's asset compiler. However, omitting the stylesheet caused Leaflet map tiles to render incorrectly in web browsers.
*   **The Fix**: A script in `TrackerMap.web.tsx` injects Leaflet's CSS link directly into the browser DOM when the map component mounts:
    ```typescript
    const cssId = 'leaflet-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    ```

### 16.3. OpenStreetMap Mobile User-Agent Blocking
*   **The Issue**: Standard OpenStreetMap tile servers block requests from React Native webview user-agents, resulting in maps rendering as blank grey grids on mobile devices.
*   **The Fix**: Switched map tiles to CartoDB Voyager raster tiles (`a.basemaps.cartocdn.com/rastertiles/voyager`), which allows traffic from mobile devices.

### 16.4. Orphaned Firebase Auth Profiles
*   **The Issue**: If a user signed up but the database write failed (or was interrupted), their authentication record would exist, but their database profile would be empty. Subsequent sign-up attempts failed with an `auth/email-already-in-use` error, while sign-in attempts failed due to the missing database profile.
*   **The Fix**: The signup handler is configured to recover from this state:
    ```typescript
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      uid = credential.user.uid;
    } catch (err: any) {
      if (err?.code === 'auth/email-already-in-use') {
        // Automatically sign in and write the missing database profile
        const credential = await signInWithEmailAndPassword(auth, email, password);
        uid = credential.user.uid;
      } else {
        throw err;
      }
    }
    ```

### 16.5. expo-location Cleanup Errors on Web Platforms
*   **The Issue**: Cleaning up GPS tracking subscriptions by calling `remove()` occasionally threw exceptions on web platforms, preventing components from unmounting cleanly.
*   **The Fix**: Wrapped subscriber cleanup calls in try-catch blocks to prevent errors from affecting the web client during page unmounting.

---

## 17. Architectural File List & Component Map

The following files make up the core of the application:

*   [`src/app/_layout.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/app/_layout.tsx): Root layout wrapper managing global state providers and authentication checks.
*   [`src/app/(tabs)/_layout.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/app/%28tabs%29/_layout.tsx): Dynamically configures the tab bar styles and handles redirects based on user roles.
*   [`src/app/auth/login.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/app/auth/login.tsx): User login view.
*   [`src/app/auth/signup.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/app/auth/signup.tsx): User registration and role selection view.
*   [`src/config/auth.ts`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/config/auth.ts): Sets up Firebase Auth integration, Google sign-in workflows, and user onboarding logic.
*   [`src/config/firebase.ts`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/config/firebase.ts): Initializes the Firebase app and sets up the Realtime Database reference.
*   [`src/context/AuthContext.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/context/AuthContext.tsx): Manages authentication state and makes credentials available to the application.
*   [`src/context/TrackerContext.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/context/TrackerContext.tsx): Manages location updates, geofence checks, battery levels, history, and simulation controls.
*   [`src/components/TrackerMap.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/components/TrackerMap.tsx): Native map rendering component using `react-native-maps`.
*   [`src/components/TrackerMap.web.tsx`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/components/TrackerMap.web.tsx): Web map rendering component using Leaflet.
*   [`src/constants/theme.ts`](file:///c:/Users/Richa/Desktop/Project/Dementia%20App%202/src/constants/theme.ts): Holds design system settings, color definitions, and light/dark theme configurations.
