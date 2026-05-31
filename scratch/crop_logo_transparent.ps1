Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path (Get-Location).Path "public/hausevo.png"
$outputPath = Join-Path (Get-Location).Path "public/hausevo.png"

# Load image
$img = [System.Drawing.Image]::FromFile($inputPath)
$bmp = New-Object System.Drawing.Bitmap($img)

$width = $bmp.Width
$height = $bmp.Height

Write-Host "Image size: $width x $height"

# Find bounds of logo (threshold of R < 235, G < 235, or B < 235)
$minX = $width
$maxX = 0
$minY = $height
$maxY = 0

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.R -lt 235 -or $pixel.G -lt 235 -or $pixel.B -lt 235) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Logo bounds: X: $minX to $maxX, Y: $minY to $maxY"

if ($maxX -le $minX -or $maxY -le $minY) {
    Write-Host "No logo elements found. Exiting."
    $bmp.Dispose()
    $img.Dispose()
    exit
}

# Add 10px padding
$padding = 10
$cropX = [Math]::Max(0, $minX - $padding)
$cropY = [Math]::Max(0, $minY - $padding)
$cropW = ($maxX - $minX) + (2 * $padding)
$cropH = ($maxY - $minY) + (2 * $padding)

Write-Host "Cropping rect: X=$cropX, Y=$cropY, W=$cropW, H=$cropH"

# Create new transparent bitmap for cropped image
$croppedBmp = New-Object System.Drawing.Bitmap($cropW, $cropH)

for ($cy = 0; $cy -lt $cropH; $cy++) {
    $sy = $cropY + $cy
    if ($sy -ge $height) { continue }
    
    for ($cx = 0; $cx -lt $cropW; $cx++) {
        $sx = $cropX + $cx
        if ($sx -ge $width) { continue }
        
        $pixel = $bmp.GetPixel($sx, $sy)
        
        # Check if it's background color
        if ($pixel.R -gt 238 -and $pixel.G -gt 238 -and $pixel.B -gt 238) {
            # Make it transparent
            $croppedBmp.SetPixel($cx, $cy, [System.Drawing.Color]::Transparent)
        } else {
            # Copy pixel as-is
            $croppedBmp.SetPixel($cx, $cy, $pixel)
        }
    }
}

# Dispose original image before writing to same path
$bmp.Dispose()
$img.Dispose()

# Save the cropped image as PNG with transparency
$croppedBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Dispose()

Write-Host "Successfully cropped, transparentized and saved to $outputPath"
