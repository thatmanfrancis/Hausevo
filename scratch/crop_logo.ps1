Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path (Get-Location).Path "public/hausevo.png"
$outputPath = Join-Path (Get-Location).Path "public/hausevo.png"

# Load image
$img = [System.Drawing.Image]::FromFile($inputPath)
$bmp = New-Object System.Drawing.Bitmap($img)

$width = $bmp.Width
$height = $bmp.Height

Write-Host "Image size: $width x $height"

# We want to find the bounding box of non-white pixels.
# Let's define a threshold for "non-white". Since the background is very bright,
# any pixel where R < 240, G < 240, or B < 240 is considered part of the logo.

$minX = $width
$maxX = 0
$minY = $height
$maxY = 0

for ($y = 0; $y -lt $height; $y += 4) {
    for ($x = 0; $x -lt $width; $x += 4) {
        $pixel = $bmp.GetPixel($x, $y)
        if ($pixel.R -lt 245 -or $pixel.G -lt 245 -or $pixel.B -lt 245) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Detected bounds (rough scan): X: $minX to $maxX, Y: $minY to $maxY"

# If we didn't find anything, do not crop
if ($maxX -le $minX -or $maxY -le $minY) {
    Write-Host "No logo detected. Exiting."
    $bmp.Dispose()
    $img.Dispose()
    exit
}

# Refine bounds (pixel by pixel around the rough boundaries)
$refinedMinX = [Math]::Max(0, $minX - 8)
$refinedMaxX = [Math]::Min($width - 1, $maxX + 8)
$refinedMinY = [Math]::Max(0, $minY - 8)
$refinedMaxY = [Math]::Min($height - 1, $maxY + 8)

# Add some padding around the cropped logo (e.g. 20 pixels)
$padding = 20
$cropX = [Math]::Max(0, $refinedMinX - $padding)
$cropY = [Math]::Max(0, $refinedMinY - $padding)
$cropW = [Math]::Min($width - $cropX, ($refinedMaxX - $refinedMinX) + (2 * $padding))
$cropH = [Math]::Min($height - $cropY, ($refinedMaxY - $refinedMinY) + (2 * $padding))

Write-Host "Cropping rect: X=$cropX, Y=$cropY, W=$cropW, H=$cropH"

# Create new cropped bitmap
$croppedBmp = New-Object System.Drawing.Bitmap($cropW, $cropH)
$graphics = [System.Drawing.Graphics]::FromImage($croppedBmp)
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $cropW, $cropH)

$graphics.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

# Dispose of original files so we can overwrite
$bmp.Dispose()
$img.Dispose()
$graphics.Dispose()

# Save the cropped image as PNG (or JPEG). Let's save it back.
# We can save it as a PNG so it can support transparency if we want, or keep it as PNG format.
# Wait, let's save as PNG because the filename extension is .png!
$croppedBmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$croppedBmp.Dispose()

Write-Host "Successfully cropped and saved to $outputPath"
