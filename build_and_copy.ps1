Write-Host "Starting Build Process..."

# 1. Run the Next.js build in the root
Write-Host "Step 1: Building Next.js application..."
npm run build

# 2. Stage files for Electron build
Write-Host "Step 2: Staging files for packaging..."
$buildTemp = "desktop/build_temp"
if (Test-Path $buildTemp) {
    Remove-Item -Recurse -Force $buildTemp
}
New-Item -ItemType Directory -Path "$buildTemp/standalone" -Force
New-Item -ItemType Directory -Path "$buildTemp/public" -Force
New-Item -ItemType Directory -Force -Path "$buildTemp/static"

Write-Host "Copying Next.js standalone server..."
Copy-Item -Path ".next/standalone/*" -Destination "$buildTemp/standalone" -Recurse -Force
Write-Host "Copying public assets..."
Copy-Item -Path "public/*" -Destination "$buildTemp/public" -Recurse -Force
Write-Host "Copying static files..."
Copy-Item -Path ".next/static/*" -Destination "$buildTemp/static" -Recurse -Force

# 3. Go to desktop and run the packager
Write-Host "Step 3: Building Desktop Installer..."
cd desktop

# Clean previous build artifacts
Remove-Item -Recurse -Force "installer" -ErrorAction SilentlyContinue

# Run electron-builder
npm run dist

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Successful!"
    
    # Ensure public folder exists
    $dest = "../public/installer"
    if (-not (Test-Path $dest)) {
        New-Item -ItemType Directory -Force -Path $dest
    }

    # Copy file
    Write-Host "Copying installer to public folder..."
    Copy-Item "installer/NextUp.1.0.1.exe" -Destination "$dest/" -Force
    
    # Cleanup temp files
    cd ..
    Remove-Item -Recurse -Force "desktop/build_temp"

    Write-Host "SUCCESS! The installer is now ready in public/installer/"
    Write-Host "You can now push these changes to GitHub."
} else {
    cd ..
    Write-Error "Build Failed. Please make sure Developer Mode is ON in Windows Settings."
}
