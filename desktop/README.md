# NextUp Desktop

Electron-based desktop version of NextUp Task Manager.

## Development

1. First, install dependencies in the main NextUp folder:
   ```bash
   cd ..
   npm install
   ```

2. Install desktop dependencies:
   ```bash
   npm install
   ```

3. Run in development mode:
   ```bash
   npm run dev
   ```

This will start the Next.js dev server and launch Electron.

## Building the Installer

1. Build the Next.js app first:
   ```bash
   cd ..
   npm run build
   ```

2. Create the Windows installer:
   ```bash
   npm run dist
   ```

The installer will be created in the `dist/` folder.

## Important Notes

- The app loads directly at the login page (no landing page)
- Google Sign-In is used for authentication
- All data is stored in Firebase (same as web version)

## Adding App Icon

Replace `resources/icon.ico` with your own 256x256 ICO file for the app icon.

---
Made by Gebin George. Check out my other work on gebin.net
