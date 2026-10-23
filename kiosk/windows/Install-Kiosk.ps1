<#
.SYNOPSIS
    Richtet Computerfuchs als Kiosk unter Windows 10 und 11 ein (Home, Pro, Education).

.DESCRIPTION
    Legt ein Standardkonto ohne Passwort an (Standard: "Kind"), meldet es beim
    Start automatisch an und zeigt dort nur Computerfuchs im Vollbild. Die Konten
    der Erwachsenen bleiben, wie sie sind.

    Modus "Shell" (Standard): Das Kinderkonto bekommt keine Windows-Oberfläche -
    kein Startmenü, keine Taskleiste, nur den Browser mit Computerfuchs. Geht der
    Browser zu, startet er neu.
    Modus "Autostart": Windows bleibt, Computerfuchs startet beim Anmelden im
    Vollbild. Sanfter, aber nicht dicht.

    Raus kommt man immer mit Strg+Alt+Entf -> Abmelden.

    NOCH NICHT AUF ECHTER HARDWARE GETESTET. Zuerst mit -WhatIf ansehen, was
    passieren würde. Anleitung: docs/KIOSK.de.md im Projekt Computerfuchs.

.PARAMETER User
    Name des Kinderkontos. Gibt es das Konto schon, wird es verwendet (darf aber
    kein Administrator sein).

.PARAMETER Url
    Adresse von Computerfuchs, z. B. ein eigener Server.

.PARAMETER Browser
    Auto (Chrome, sonst Edge, sonst Firefox), Chrome, Edge oder Firefox.

.PARAMETER Mode
    Shell (Standard) oder Autostart.

.PARAMETER NoAutoLogon
    Keine automatische Anmeldung einrichten.

.PARAMETER Uninstall
    Alles wieder entfernen. Das Konto bleibt, außer mit -RemoveUser.

.PARAMETER RemoveUser
    Mit -Uninstall: auch das Konto samt Spielständen löschen.

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1 -WhatIf

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1 -Browser Firefox -Mode Autostart

.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\Install-Kiosk.ps1 -Uninstall
#>
#Requires -Version 5.1
#Requires -RunAsAdministrator
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [ValidatePattern('^[A-Za-z0-9._-]{1,20}$')]
    [string]$User = 'Kind',

    [ValidatePattern('^https?://[^\s"''\\]+$')]
    [string]$Url = 'https://technikweber.github.io/Computerfuchs/?kiosk',

    [ValidateSet('Auto', 'Chrome', 'Edge', 'Firefox')]
    [string]$Browser = 'Auto',

    [ValidateSet('Shell', 'Autostart')]
    [string]$Mode = 'Shell',

    [switch]$NoAutoLogon,
    [switch]$Uninstall,
    [switch]$RemoveUser
)

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$ScriptVersion = '0.2.0'
$DataDir = Join-Path $env:ProgramData 'Computerfuchs'
$Launcher = Join-Path $DataDir 'Start-Computerfuchs.ps1'
$Marker = 'HKLM:\SOFTWARE\Computerfuchs\Kiosk'
$Winlogon = 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon'
$OobePolicy = 'HKLM:\SOFTWARE\Policies\Microsoft\Windows\OOBE'
$HiveName = 'Computerfuchs-Kiosk'
$PowerShellExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'

function Write-Step([string]$Text) {
    Write-Host ''
    Write-Host "-> $Text" -ForegroundColor Yellow
}

function Write-Note([string]$Text) {
    Write-Host "   $Text"
}

# ---------------------------------------------------------------------------
# Hilfsfunktionen
# ---------------------------------------------------------------------------

function Find-Browser([string]$Wanted) {
    $pf = $env:ProgramFiles
    $pf86 = ${env:ProgramFiles(x86)}
    $candidates = @{
        Chrome  = @("$pf\Google\Chrome\Application\chrome.exe", "$pf86\Google\Chrome\Application\chrome.exe")
        Edge    = @("$pf86\Microsoft\Edge\Application\msedge.exe", "$pf\Microsoft\Edge\Application\msedge.exe")
        Firefox = @("$pf\Mozilla Firefox\firefox.exe", "$pf86\Mozilla Firefox\firefox.exe")
    }
    if ($Wanted -eq 'Auto') { $order = @('Chrome', 'Edge', 'Firefox') } else { $order = @($Wanted) }
    foreach ($name in $order) {
        foreach ($path in $candidates[$name]) {
            if ($path -and (Test-Path -LiteralPath $path)) {
                return [pscustomobject]@{ Name = $name; Path = $path }
            }
        }
    }
    throw "Kein passender Browser gefunden ($Wanted). Am besten Google Chrome installieren (für alle Benutzer)."
}

function Get-BrowserArguments([string]$Name, [string]$Address) {
    switch ($Name) {
        # Chrome im Kiosk-Modus behält das normale Profil - die Spielstände bleiben.
        'Chrome' {
            return @('--kiosk', '--no-first-run', '--no-default-browser-check', '--noerrdialogs',
                '--disable-session-crashed-bubble', '--autoplay-policy=no-user-gesture-required',
                '--overscroll-history-navigation=0', '--disable-pinch', $Address)
        }
        # Edge im eigenen Kiosk-Modus läuft immer InPrivate: Spielstände wären nach jedem Neustart weg.
        # Darum als App-Fenster im Vollbild.
        'Edge' {
            return @("--app=$Address", '--start-fullscreen', '--no-first-run', '--no-default-browser-check',
                '--noerrdialogs', '--autoplay-policy=no-user-gesture-required',
                '--overscroll-history-navigation=0', '--disable-pinch')
        }
        'Firefox' { return @('--kiosk', $Address) }
    }
}

function ConvertTo-Quoted([string]$Text) {
    return "'" + $Text.Replace("'", "''") + "'"
}

function Get-RegValue([string]$Path, [string]$Name) {
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    $item = Get-ItemProperty -LiteralPath $Path
    if ($item.PSObject.Properties.Name -contains $Name) { return $item.$Name }
    return $null
}

function Set-RegValue([string]$Path, [string]$Name, $Value, [string]$Type = 'String') {
    if (-not (Test-Path -LiteralPath $Path)) { New-Item -Path $Path -Force | Out-Null }
    New-ItemProperty -LiteralPath $Path -Name $Name -Value $Value -PropertyType $Type -Force | Out-Null
}

function Set-RegList([string]$Path, [string[]]$Values) {
    if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Recurse -Force }
    New-Item -Path $Path -Force | Out-Null
    for ($i = 0; $i -lt $Values.Count; $i++) {
        New-ItemProperty -LiteralPath $Path -Name ([string]($i + 1)) -Value $Values[$i] -PropertyType String -Force | Out-Null
    }
}

function Remove-RegKey([string]$Path) {
    if (Test-Path -LiteralPath $Path) { Remove-Item -LiteralPath $Path -Recurse -Force }
}

function Remove-RegValue([string]$Path, [string]$Name) {
    if ($null -ne (Get-RegValue $Path $Name)) { Remove-ItemProperty -LiteralPath $Path -Name $Name }
}

# Ist das Konto in der Gruppe der Administratoren? (Über ADSI - Get-LocalGroupMember
# bricht auf manchen Rechnern mit verwaisten Einträgen ab.)
function Test-LocalAdmin([string]$Name) {
    $groupName = (New-Object System.Security.Principal.SecurityIdentifier('S-1-5-32-544')).Translate(
        [System.Security.Principal.NTAccount]).Value.Split('\')[-1]
    $group = [ADSI]"WinNT://$env:COMPUTERNAME/$groupName,group"
    foreach ($member in @($group.Invoke('Members'))) {
        $memberName = $member.GetType().InvokeMember('Name', 'GetProperty', $null, $member, $null)
        if ($memberName -eq $Name) { return $true }
    }
    return $false
}

# Das Profil des Kinderkontos anlegen, ohne sich anzumelden - dann lässt sich seine Registry vorbereiten.
function New-UserProfile([string]$Sid, [string]$Name) {
    $key = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\$Sid"
    if (-not (Test-Path -LiteralPath $key)) {
        if (-not ('Computerfuchs.Native' -as [type])) {
            Add-Type -Namespace Computerfuchs -Name Native -MemberDefinition @'
[System.Runtime.InteropServices.DllImport("userenv.dll", CharSet = System.Runtime.InteropServices.CharSet.Unicode, SetLastError = true)]
public static extern int CreateProfile(string pszUserSid, string pszUserName, System.Text.StringBuilder pszProfilePath, uint cchProfilePath);
'@
        }
        $buffer = New-Object System.Text.StringBuilder 260
        $hr = [Computerfuchs.Native]::CreateProfile($Sid, $Name, $buffer, 260)
        # 0x800700B7: gibt es schon
        if ($hr -ne 0 -and $hr -ne -2147024713) {
            throw ('Das Profil von {0} ließ sich nicht anlegen (Fehler 0x{1:X8}).' -f $Name, $hr)
        }
    }
    return (Get-RegValue $key 'ProfileImagePath')
}

# Etwas in der Registry des Kinderkontos tun. Ist das Konto gerade angemeldet, ist sie schon geladen.
function Invoke-InUserHive([string]$Sid, [string]$ProfilePath, [scriptblock]$Action) {
    if (Test-Path -LiteralPath "Registry::HKEY_USERS\$Sid") {
        & $Action "Registry::HKEY_USERS\$Sid"
        return
    }
    $hive = Join-Path $ProfilePath 'NTUSER.DAT'
    if (-not (Test-Path -LiteralPath $hive)) { throw "Die Registry-Datei des Kinderkontos fehlt: $hive" }
    # Übrig von einem abgebrochenen Lauf?
    if (Test-Path -LiteralPath "Registry::HKEY_USERS\$HiveName") { & reg.exe unload "HKU\$HiveName" | Out-Null }
    & reg.exe load "HKU\$HiveName" $hive | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Die Registry des Kinderkontos ließ sich nicht laden.' }
    try {
        & $Action "Registry::HKEY_USERS\$HiveName"
    }
    finally {
        [GC]::Collect()
        [GC]::WaitForPendingFinalizers()
        for ($try = 0; $try -lt 5; $try++) {
            & reg.exe unload "HKU\$HiveName" | Out-Null
            if ($LASTEXITCODE -eq 0) { break }
            Start-Sleep -Milliseconds 500
        }
    }
}

function Set-KioskPolicies([string]$Root, [string]$Address) {
    $uri = [Uri]$Address
    $chromiumAllow = ($Address -split '#', 2)[0]
    $chromiumAllow = ($chromiumAllow -split '\?', 2)[0]
    $firefoxAllow = '{0}://{1}{2}*' -f $uri.Scheme, $uri.Host, $uri.AbsolutePath

    # Windows: kein Task-Manager, kein Passwortändern
    $system = "$Root\Software\Microsoft\Windows\CurrentVersion\Policies\System"
    Set-RegValue $system 'DisableTaskMgr' 1 'DWord'
    Set-RegValue $system 'DisableChangePassword' 1 'DWord'

    # Chrome und Edge: nur Computerfuchs, keine Entwicklerwerkzeuge, kein privates Fenster
    $common = @{
        DeveloperToolsAvailability   = 2
        BrowserSignin                = 0
        SyncDisabled                 = 1
        PasswordManagerEnabled       = 0
        AutofillAddressEnabled       = 0
        AutofillCreditCardEnabled    = 0
        TranslateEnabled             = 0
        PrintingEnabled              = 0
        BrowserGuestModeEnabled      = 0
        DefaultBrowserSettingEnabled = 0
        BackgroundModeEnabled        = 0
        PromptForDownloadLocation    = 0
    }
    $chrome = "$Root\Software\Policies\Google\Chrome"
    $edge = "$Root\Software\Policies\Microsoft\Edge"
    foreach ($key in @($chrome, $edge)) {
        foreach ($name in $common.Keys) { Set-RegValue $key $name $common[$name] 'DWord' }
        Set-RegValue $key 'DownloadDirectory' '${documents}\Computerfuchs'
        Set-RegList "$key\URLBlocklist" @('*')
        Set-RegList "$key\URLAllowlist" @($chromiumAllow)
    }
    Set-RegValue $chrome 'IncognitoModeAvailability' 1 'DWord'
    Set-RegValue $chrome 'BrowserAddPersonEnabled' 0 'DWord'
    Set-RegValue $chrome 'MetricsReportingEnabled' 0 'DWord'
    Set-RegValue $edge 'InPrivateModeAvailability' 1 'DWord'
    Set-RegValue $edge 'BrowserAddProfileEnabled' 0 'DWord'
    Set-RegValue $edge 'HideFirstRunExperience' 1 'DWord'
    Set-RegValue $edge 'StartupBoostEnabled' 0 'DWord'
    Set-RegValue $edge 'HubsSidebarEnabled' 0 'DWord'
    Set-RegValue $edge 'EdgeShoppingAssistantEnabled' 0 'DWord'
    Set-RegValue $edge 'ShowRecommendationsEnabled' 0 'DWord'

    # Firefox
    $firefox = "$Root\Software\Policies\Mozilla\Firefox"
    foreach ($name in @('DisableDeveloperTools', 'DisablePrivateBrowsing', 'DisableFirefoxAccounts', 'DisableTelemetry',
            'DontCheckDefaultBrowser', 'DisableProfileImport', 'DisablePocket', 'NoDefaultBookmarks')) {
        Set-RegValue $firefox $name 1 'DWord'
    }
    Set-RegValue $firefox 'PasswordManagerEnabled' 0 'DWord'
    Set-RegValue $firefox 'PromptForDownloadLocation' 0 'DWord'
    Set-RegValue $firefox 'OverrideFirstRunPage' ''
    Set-RegValue $firefox 'OverridePostUpdatePage' ''
    Set-RegValue $firefox 'DefaultDownloadDirectory' '${home}\Documents\Computerfuchs'
    Set-RegList "$firefox\WebsiteFilter\Block" @('<all_urls>')
    Set-RegList "$firefox\WebsiteFilter\Exceptions" @($firefoxAllow)
}

function Clear-KioskSettings([string]$Root) {
    Remove-RegValue "$Root\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" 'Shell'
    Remove-RegValue "$Root\Software\Microsoft\Windows\CurrentVersion\Run" 'Computerfuchs'
    Remove-RegValue "$Root\Software\Microsoft\Windows\CurrentVersion\Policies\System" 'DisableTaskMgr'
    Remove-RegValue "$Root\Software\Microsoft\Windows\CurrentVersion\Policies\System" 'DisableChangePassword'
    Remove-RegValue "$Root\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" 'NoControlPanel'
    Remove-RegKey "$Root\Software\Policies\Google\Chrome"
    Remove-RegKey "$Root\Software\Policies\Microsoft\Edge"
    Remove-RegKey "$Root\Software\Policies\Mozilla\Firefox"
}

# ---------------------------------------------------------------------------
# Entfernen
# ---------------------------------------------------------------------------

if ($Uninstall) {
    Write-Step "Computerfuchs-Kiosk wird entfernt ($User)"
    if ($WhatIfPreference) {
        Write-Note 'Nur Vorschau (-WhatIf): Es wird nichts geändert. Das würde passieren:'
        Write-Note "Oberfläche, Autostart und Sperren von $User zurücksetzen"
        Write-Note "Automatische Anmeldung ausschalten, $DataDir löschen"
        if ($RemoveUser) { Write-Note "Das Konto $User mit allen Spielständen löschen" }
        return
    }
    $account = Get-LocalUser -Name $User -ErrorAction SilentlyContinue
    if ($account) {
        $sid = $account.SID.Value
        $profilePath = Get-RegValue "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\$sid" 'ProfileImagePath'
        if ($profilePath) {
            Invoke-InUserHive $sid $profilePath { param($root) Clear-KioskSettings $root }
            Write-Note 'Oberfläche und Sperren des Kinderkontos zurückgesetzt.'
        }
    }

    if ((Get-RegValue $Winlogon 'DefaultUserName') -eq $User) {
        Set-ItemProperty -LiteralPath $Winlogon -Name AutoAdminLogon -Value '0'
        Remove-RegValue $Winlogon 'DefaultPassword'
        $previous = Get-RegValue $Marker 'PreviousDefaultUserName'
        if ($previous) { Set-ItemProperty -LiteralPath $Winlogon -Name DefaultUserName -Value $previous }
        Write-Note 'Automatische Anmeldung ausgeschaltet.'
        if ((Get-RegValue $Marker 'PreviousAutoAdminLogon') -eq '1') {
            Write-Note "Vorher wurde $previous automatisch angemeldet - das bei Bedarf mit netplwiz neu einrichten."
        }
    }

    if ((Get-RegValue $Marker 'SetPrivacyPolicy') -eq 1) { Remove-RegValue $OobePolicy 'DisablePrivacyExperience' }
    if (Test-Path -LiteralPath $DataDir) { Remove-Item -LiteralPath $DataDir -Recurse -Force }
    Remove-RegKey $Marker

    if ($RemoveUser -and $account) {
        if ($PSCmdlet.ShouldProcess($User, 'Konto und alle Spielstände löschen')) {
            $userProfile = Get-CimInstance Win32_UserProfile | Where-Object { $_.SID -eq $account.SID.Value }
            if ($userProfile) { $userProfile | Remove-CimInstance }
            Remove-LocalUser -Name $User
            Write-Note "Konto $User gelöscht."
        }
    }
    Write-Step 'Fertig.'
    return
}

# ---------------------------------------------------------------------------
# Einrichten
# ---------------------------------------------------------------------------

$found = Find-Browser $Browser
$arguments = Get-BrowserArguments $found.Name $Url
$shellCommand = '"{0}" -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "{1}"' -f $PowerShellExe, $Launcher

Write-Step "Computerfuchs-Kiosk $ScriptVersion"
Write-Note "Kinderkonto: $User"
Write-Note "Browser:     $($found.Name) ($($found.Path))"
Write-Note "Adresse:     $Url"
if ($Mode -eq 'Shell') {
    Write-Note 'Modus:       Shell - ohne Windows-Oberfläche'
}
else {
    Write-Note 'Modus:       Autostart - Windows bleibt, Computerfuchs startet im Vollbild'
}

if ($WhatIfPreference) {
    Write-Step 'Nur Vorschau (-WhatIf): Es wird nichts geändert. Das würde passieren:'
    if (-not (Get-LocalUser -Name $User -ErrorAction SilentlyContinue)) {
        Write-Note "1. Standardkonto $User ohne Passwort anlegen und sein Profil vorbereiten"
    }
    else {
        Write-Note "1. Vorhandenes Konto $User verwenden (darf kein Administrator sein)"
    }
    Write-Note "2. Startskript schreiben: $Launcher"
    if ($Mode -eq 'Shell') {
        Write-Note "3. Für $User statt der Windows-Oberfläche starten: $shellCommand"
    }
    else {
        Write-Note "3. Für $User beim Anmelden starten: $shellCommand"
    }
    Write-Note "4. Für $User sperren: Task-Manager, Entwicklerwerkzeuge, private Fenster, alle Seiten außer Computerfuchs"
    if (-not $NoAutoLogon) { Write-Note "5. $User beim Start automatisch anmelden" }
    Write-Note '6. Die Datenschutz-Fragen bei der ersten Anmeldung neuer Konten überspringen'
    return
}

# 1. Konto
Write-Step "Kinderkonto $User"
$account = Get-LocalUser -Name $User -ErrorAction SilentlyContinue
if (-not $account) {
    $account = New-LocalUser -Name $User -NoPassword -FullName 'Computerfuchs' -Description 'Kinderkonto für Computerfuchs' `
        -AccountNeverExpires -UserMayNotChangePassword
    Set-LocalUser -Name $User -PasswordNeverExpires $true
    try {
        Add-LocalGroupMember -SID 'S-1-5-32-545' -Member $User
    }
    catch {
        if ($_.FullyQualifiedErrorId -notlike 'MemberExists*') { throw }
    }
    Write-Note 'angelegt (Standardbenutzer, ohne Passwort)'
}
if (Test-LocalAdmin $User) {
    throw "Das Konto $User ist Administrator. Für den Kiosk bitte ein Standardkonto nehmen (-User)."
}
$sid = $account.SID.Value
$profilePath = New-UserProfile $sid $User
Write-Note "Profil: $profilePath"

# 2. Startskript
Write-Step 'Startskript'
if (-not (Test-Path -LiteralPath $DataDir)) { New-Item -ItemType Directory -Path $DataDir | Out-Null }
$launcherCode = @'
# Computerfuchs-Kiosk: startet den Browser im Vollbild und startet ihn neu, wenn er zugeht.
# Erzeugt von Install-Kiosk.ps1 - Änderungen gehen beim nächsten Einrichten verloren.
$ErrorActionPreference = 'Continue'
$browser = __BROWSER__
$arguments = @(__ARGUMENTS__)
$name = [System.IO.Path]::GetFileNameWithoutExtension($browser)
$session = (Get-Process -Id $PID).SessionId
$log = Join-Path $env:LOCALAPPDATA 'Computerfuchs-Kiosk.log'
if ((Test-Path -LiteralPath $log) -and (Get-Item -LiteralPath $log).Length -gt 1MB) { Remove-Item -LiteralPath $log -Force }
while ($true) {
    Add-Content -LiteralPath $log -Value ('{0:s} Start {1}' -f (Get-Date), $browser)
    try {
        Start-Process -FilePath $browser -ArgumentList $arguments -Wait
    }
    catch {
        Add-Content -LiteralPath $log -Value $_.Exception.Message
        Start-Sleep -Seconds 10
    }
    # Chrome und Edge laufen manchmal im Hintergrund weiter - erst neu starten, wenn alles zu ist.
    while (Get-Process -Name $name -ErrorAction SilentlyContinue | Where-Object { $_.SessionId -eq $session }) {
        Start-Sleep -Seconds 1
    }
    Start-Sleep -Seconds 1
}
'@
$launcherCode = $launcherCode.Replace('__BROWSER__', (ConvertTo-Quoted $found.Path))
$launcherCode = $launcherCode.Replace('__ARGUMENTS__', (($arguments | ForEach-Object { ConvertTo-Quoted $_ }) -join ', '))
# UTF-8 mit BOM, damit Windows PowerShell die Umlaute richtig liest
[System.IO.File]::WriteAllText($Launcher, $launcherCode, (New-Object System.Text.UTF8Encoding $true))
Write-Note $Launcher

# 3. und 4. Oberfläche und Sperren im Profil des Kindes
Write-Step "Oberfläche und Sperren für $User"
Invoke-InUserHive $sid $profilePath {
    param($root)
    Clear-KioskSettings $root
    if ($Mode -eq 'Shell') {
        # Eigene Oberfläche nur für dieses Konto; alle anderen behalten den Explorer.
        Set-RegValue "$root\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" 'Shell' $shellCommand
    }
    else {
        Set-RegValue "$root\Software\Microsoft\Windows\CurrentVersion\Run" 'Computerfuchs' $shellCommand
        Set-RegValue "$root\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" 'NoControlPanel' 1 'DWord'
    }
    Set-KioskPolicies $root $Url
}
Write-Note 'erledigt'

# Merken, was vorher war - für -Uninstall
$previousUser = Get-RegValue $Winlogon 'DefaultUserName'
if ($null -eq (Get-RegValue $Marker 'User') -and $previousUser -ne $User) {
    Set-RegValue $Marker 'PreviousAutoAdminLogon' ([string](Get-RegValue $Winlogon 'AutoAdminLogon'))
    Set-RegValue $Marker 'PreviousDefaultUserName' ([string]$previousUser)
}
Set-RegValue $Marker 'User' $User
Set-RegValue $Marker 'Mode' $Mode
Set-RegValue $Marker 'Browser' $found.Name

# 5. Automatische Anmeldung
if (-not $NoAutoLogon) {
    Write-Step "Automatische Anmeldung für $User"
    Set-ItemProperty -LiteralPath $Winlogon -Name AutoAdminLogon -Value '1'
    Set-ItemProperty -LiteralPath $Winlogon -Name DefaultUserName -Value $User
    Set-ItemProperty -LiteralPath $Winlogon -Name DefaultDomainName -Value $env:COMPUTERNAME
    Set-ItemProperty -LiteralPath $Winlogon -Name DefaultPassword -Value ''
    Remove-RegValue $Winlogon 'AutoLogonCount'
    Write-Note 'Beim Start die Umschalttaste gedrückt halten, um sie einmal zu überspringen.'
}

# 6. Datenschutz-Fragen beim ersten Anmelden überspringen (sonst wartet dort ein Fenster)
if ($null -eq (Get-RegValue $OobePolicy 'DisablePrivacyExperience')) {
    Set-RegValue $OobePolicy 'DisablePrivacyExperience' 1 'DWord'
    Set-RegValue $Marker 'SetPrivacyPolicy' 1 'DWord'
}

Write-Step 'Fertig!'
Write-Note 'Jetzt neu starten. Danach meldet sich das Kinderkonto an und Computerfuchs startet.'
Write-Note 'Raus kommen: Strg+Alt+Entf -> Abmelden, dann mit dem Eltern-Konto anmelden.'
Write-Note 'Wichtig: Das Eltern-Konto braucht ein Passwort.'
Write-Note "Rückgängig: powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Uninstall"
