$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8080/')
$listener.Start()
Write-Host 'Server started on http://localhost:8080/'

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $localPath = $request.Url.LocalPath
    if ($localPath -eq '/') {
        $localPath = '/simulation_3D.html'
    }

    $filePath = Join-Path 'c:\Users\Administrator\Desktop\stickmachine' ($localPath.TrimStart('/'))

    if (Test-Path $filePath) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()

        $contentType = 'application/octet-stream'
        if ($ext -eq '.html') { $contentType = 'text/html; charset=utf-8' }
        elseif ($ext -eq '.js') { $contentType = 'application/javascript' }
        elseif ($ext -eq '.css') { $contentType = 'text/css' }
        elseif ($ext -eq '.json') { $contentType = 'application/json' }
        elseif ($ext -eq '.png') { $contentType = 'image/png' }
        elseif ($ext -eq '.jpg') { $contentType = 'image/jpeg' }
        elseif ($ext -eq '.svg') { $contentType = 'image/svg+xml' }

        $response.ContentType = $contentType
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes('Not Found')
        $response.OutputStream.Write($msg, 0, $msg.Length)
    }

    $response.OutputStream.Close()
}
