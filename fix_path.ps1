$gitBin = "C:\Program Files\Git\bin"
$gitCmd = "C:\Program Files\Git\cmd"
$nodePath = "C:\Program Files\nodejs"

$pathsToAdd = @($gitBin, $gitCmd, $nodePath)

Write-Host "Repairing Current Session `$env:PATH..."
foreach ($p in $pathsToAdd) {
    if ($env:Path -notlike "*$p*") {
        $env:Path += ";$p"
        Write-Host "Appended: $p"
    } else {
        Write-Host "Already exists: $p"
    }
}

Write-Host "`nRepairing Persistent User Path..."
$userPath = [Environment]::GetEnvironmentVariable("Path", [EnvironmentVariableTarget]::User)
$changed = $false
foreach ($p in $pathsToAdd) {
    if ($userPath -notmatch [regex]::Escape($p)) {
        if ($userPath -notmatch ";$") {
            $userPath += ";"
        }
        $userPath += "$p"
        $changed = $true
        Write-Host "Staged to User Path: $p"
    }
}

if ($changed) {
    [Environment]::SetEnvironmentVariable("Path", $userPath, [EnvironmentVariableTarget]::User)
    Write-Host "Persisted User Path updates."
} else {
    Write-Host "User Path already contains required binaries."
}

Write-Host "`nTesting Native Execution:"
Write-Host "------------------------"
$gitOutput = & git --version 2>&1
Write-Host "Git Native: $gitOutput"

$nodeOutput = & node -v 2>&1
Write-Host "Node Native: $nodeOutput"
