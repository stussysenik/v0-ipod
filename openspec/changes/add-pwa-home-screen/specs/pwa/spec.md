## ADDED Requirements

### Requirement: Web App Manifest
The app SHALL provide a web app manifest at `/manifest.webmanifest` that includes:
- App name and short_name
- Start URL
- Display mode (standalone)
- Theme and background colors
- Icons in multiple sizes (192x192, 512x512)

#### Scenario: Manifest served correctly
- **WHEN** a browser requests `/manifest.webmanifest`
- **THEN** a valid JSON manifest is returned with required PWA fields

### Requirement: Service Worker
The app SHALL register a service worker that enables offline caching of static assets.

#### Scenario: Service worker registered on load
- **WHEN** the app loads in a browser
- **THEN** a service worker is registered and activates

### Requirement: Add to Home Screen
The app SHALL be installable on mobile devices via "Add to Home Screen" functionality.

#### Scenario: Install prompt available
- **WHEN** the PWA criteria are met (manifest + service worker + HTTPS)
- **THEN** the browser allows the user to install the app to home screen
