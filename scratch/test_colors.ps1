Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile((Join-Path (Get-Location).Path "public/hausevo.png"))
$bmp = New-Object System.Drawing.Bitmap($img)

Write-Host "Width: $($bmp.Width), Height: $($bmp.Height)"
Write-Host "Corner pixel (0,0):" ($bmp.GetPixel(0, 0))
Write-Host "Corner pixel (width-1, 0):" ($bmp.GetPixel($bmp.Width - 1, 0))
Write-Host "Corner pixel (0, height-1):" ($bmp.GetPixel(0, $bmp.Height - 1))
Write-Host "Middle pixel (width/2, height/2):" ($bmp.GetPixel([int]($bmp.Width/2), [int]($bmp.Height/2)))

# Scan vertical line in the middle
for ($y = 0; $y -lt $bmp.Height; $y += 50) {
    $p = $bmp.GetPixel([int]($bmp.Width/2), $y)
    Write-Host ("y=" + $y + " R=" + $p.R + " G=" + $p.G + " B=" + $p.B)
}

$bmp.Dispose()
$img.Dispose()
