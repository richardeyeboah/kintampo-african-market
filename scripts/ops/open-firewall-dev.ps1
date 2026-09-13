# Run ONCE as Administrator: right-click PowerShell -> Run as administrator, then:
#   cd "path\to\project"
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
#   .\scripts\open-firewall-dev.ps1
#
# Or: right-click this file -> Run with PowerShell (if execution policy allows).

$ErrorActionPreference = 'Stop'

$rules = @(
    @{ Port = 3000; Name = 'Kintampo Next.js dev TCP 3000' }
    @{ Port = 3002; Name = 'Kintampo Next.js dev TCP 3002 (e2e)' }
)

foreach ($r in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $r.Name -ErrorAction SilentlyContinue
    if ($existing) {
        Remove-NetFirewallRule -DisplayName $r.Name
    }
    New-NetFirewallRule `
        -DisplayName $r.Name `
        -Direction Inbound `
        -Protocol TCP `
        -LocalPort $r.Port `
        -Action Allow `
        -Profile Private `
        -Enabled True | Out-Null
    Write-Host "Added firewall rule: $($r.Name) (TCP $($r.Port), Private profile)"
}

Write-Host "`nDone. Phone on same WiFi can use http://<YOUR_PC_IP>:3000"
