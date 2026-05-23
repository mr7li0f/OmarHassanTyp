$src = "C:\Users\Public\Temp\omar_cleaned\*"
$dst = "C:\Users\mr7li0\Desktop\public\"
Copy-Item -Path $src -Destination $dst -Recurse -Force -Exclude "index.html" -ErrorAction SilentlyContinue
$splashIndex = "C:\Users\Public\Temp\omar_cleaned\index.html"
Copy-Item -Path $splashIndex -Destination "$dst\index.html" -Force -ErrorAction SilentlyContinue
# Copy admin folder specifically
$adminSrc = "C:\Users\Public\Temp\omar_cleaned\admin"
if (Test-Path $adminSrc) {
    Copy-Item -Path "$adminSrc\*" -Destination "$dst\admin\" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "Copy completed!"
