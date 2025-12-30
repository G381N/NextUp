Write-Host "Starting Build Process..."
cd desktop

# Run the build
Write-Host "Running npm run dist..."
npm run dist

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build Successful!"
    
    # Ensure folder exists
    $dest = "../public/installer"
    if (-not (Test-Path $dest)) {
        New-Item -ItemType Directory -Force -Path $dest
    }

    # Copy file
    Write-Host "Copying installer..."
    Copy-Item "installer/NextUp.1.0.0.exe" -Destination "$dest/" -Force
    
    Write-Host "DONE. Installer is ready in public/installer/"
} else {
    Write-Error "Build Failed. Please enable 'Developer Mode' in Windows Settings to allow symbolic links."
}
