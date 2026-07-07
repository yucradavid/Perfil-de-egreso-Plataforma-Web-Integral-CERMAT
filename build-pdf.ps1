# build-pdf.ps1
# Regenera perfil-egreso-completo.pdf a partir de TODA la documentacion actual.
# Uso: desde la carpeta perfil-egreso/, ejecutar:  .\build-pdf.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
}

Write-Host "1/3 Construyendo el sitio (mkdocs build)..."
mkdocs build --strict

$printPage = Join-Path $root "site\print_page\index.html"
if (-not (Test-Path $printPage)) {
    throw "No se encontro $printPage. Verifica que el plugin 'print-site' este habilitado en mkdocs.yml."
}

$outPdf = Join-Path $root "docs\assets\perfil-egreso-completo.pdf"
Write-Host "2/3 Generando PDF combinado con Chrome headless..."
& $chrome --headless --disable-gpu --no-sandbox `
    --print-to-pdf="$outPdf" `
    --no-pdf-header-footer --print-to-pdf-no-header `
    --run-all-compositor-stages-before-draw --virtual-time-budget=15000 `
    "file:///$($printPage -replace '\\','/')"

Write-Host "3/3 Listo: $outPdf"
Write-Host "Recuerda volver a correr 'mkdocs build' (o mkdocs serve) para que el sitio publicado incluya el PDF actualizado."
