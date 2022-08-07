# * ********************************************************************************************************* *
# *
# * Copyright 2022 Michal Kelnar
# *
# * SPDX-License-Identifier: BSD-3-Clause
# * The BSD-3-Clause license for this file can be found in the LICENSE.txt file included with this distribution
# * or at https://spdx.org/licenses/BSD-3-Clause.html#licenseText
# *
# * ********************************************************************************************************* *
$version = 20220200
$updateUrl = "https://hub.dev.oidis.io/Configuration/com-wui-framework-services/BaseInstallationRecipe/2019.0.0"
$isDryRun = 0
$isForce = 0
$tempPath = "/tmp"
#$tempPath = Join-Path [System.IO.Path]::GetTempPath() "selfupdate-script"
if (-not(Test-Path $tempPath))
{
    new-item "$tempPath" -ItemType Directory -Force
}
$tmpScript = Join-Path $tempPath $( "autoupdatescript-" +
        [Math]::Ceiling((New-TimeSpan -Start (Get-Date "01/01/1970") -End (Get-Date)).TotalSeconds) + ".ps1")
$logFile = Join-Path $tempPath "autoupdatescript.log"
$sourceFile = $MyInvocation.MyCommand.Path

function log([String]$log)
{
    echo "$log"
    echo "[$((Get-Date).ToUniversalTime() )][INFO]: $log" >> $logFile
}

function logError([String]$err)
{
    echo "$err" 2>&1
    echo "[$((Get-Date).ToUniversalTime() )][ERROR]: $err" >> $logFile
}

function exitHandler([Int32]$exitCode)
{
    log "Clean up before exit: $exitCode"
    if (Test-Path $tmpScript)
    {
        Remove-Item -Path "$tmpScript" -Force
    }
    exit $exitCode
}

function download()
{
    $updateUrl="proto://unknoen/file.ts"
    try
    {
        if ($isDryRun -eq 1)
        {
            #    cp -p "$sourceFile" "$tmpScript"
            Copy-Item "$sourceFile" -Destination "$tmpScript"
        }
        else
        {
            log "Download file from: $updateUrl"
            Invoke-WebRequest -Uri "$updateUrl" -OutFile "$tmpScript"
        }
    }
    catch
    {
        logError $_.Exception.Message
    }
    log "Downloaded content: $tmpScript"
    if (Test-Path $tmpScript)
    {
        log "New script downloaded: $tmpScript"
    }
    else
    {
        logError "Failed to download new script"
        exitHandler -1
    }
}

function update()
{
    log "**********  Automatic update of this executor script content starting  **********"
    if ($isForce -eq 1)
    {
        # todo add some countdown (10s) to let user choose Y/n question here
        Write-Output "TBD"
    }
    if ($isDryRun -eq 1)
    {
        log "Utility is executed in dry-run mode, this will only print steps without any modification"
    }

    download
    validate $tmpScript

    $scriptFile = Get-Item $sourceFile
    $scriptName = "$( $scriptFile.Basename )$( $scriptFile.Extension )"
    $outputFile = Join-Path $tempPath "$scriptName.backup"
    log "Create backup into $outputFile"
    #  cp -pf "$sourceFile" "/tmp/$sourceFile.backup" || exitHandler -1
    Copy-Item "$sourceFile" -Destination "$outputFile" -ErrorAction Stop

    log "Overwrite current file by downloaded script"
    if ($isDryRun -eq 1)
    {
        #    cp -pf "$tmpScript" "$sourceFile" || exitHandler -1
        Copy-Item "$tmpScript" -Destination "$sourceFile" -ErrorAction Stop
    }

    validate "$sourceFile"

    log "Script update succeed"
}

function validate($script)
{
    # this function should fail and exit if not succeed, update will continue otherwise
    log "Validate downloaded script: $script --version"
    try
    {
        & "$script" "sus-update" "--version"
        log "validated"
    }
    catch
    {
        logError "error handled"
        exitHandler 1
    }
}

function help()
{
    Write-Output "Self update script utility is able to wrap custom script by self updating feature from new content"
    Write-Output "Usage: {script-name} sus-update [options]"
    Write-Output "Options below are applicable only when sus-update sub-command is used for script invocation."
    Write-Output "Any other invocation is directly redirected to custom script (TBD)"
    Write-Output "  -v|--version       Prints selfupdate-script version"
    Write-Output "  -h|--help          Prints selfupdate-script help"
    Write-Output "  --get-url          Prints internally defined update url"
    Write-Output "  --update-url <>    Specify overwrite for internally defined update url"
    Write-Output "  --dry-run          Use this for validation purposes, it will do everything except download
                             from url (mocked copy of itself will be validated) and original script overwrite"
    Write-Output "  --force            Force do the script update without any user prompts."
    Write-Output "  sus-update         Overwrite itself by new content"
}

function argParse($argList)
{
    Write-Output "Args cnt: $( $argList.Count )"
    Write-Output "Args: $argList"
    for ($i = 0; $i -lt $argList.count; $i++) {
        Write-Output "Argument  $i is $( $argList[$i] )"
        switch ($argList[$i])
        {
            "-h" {
            }
            "--help" {
                help;
                exit 0;
            }
            "--get-url"{
                Write-Output $updateUrl;
                exit 0;
            }
            "--dry-run"{
                $script:isDryRun = 1;
                break
            }
            "--update-url"{
                $script:updateUrl = $argList[++$i]
                ; break
            }
            "--force"{
                $script:isForce = 1;
                break
            }
            "-v"{
            }
            "--version"{
                Write-Output $version;
                exit 0
            }
            default {
                Write-Error "Unknown option: $( $argList[$i] )"
                exit 1
            }
        }
    }
}

# do not specify args to let PS deduce $args from "unnamed" parameters itself
function embeddedScript()
{
    ## BEGIN - selfupdate-script embedded content
    Write-Output "Invocation of embedded script $( $args[0] )"
    ## END - selfupdate-script embedded content
}

function main($argList)
{
    if ($argList[0] -eq "sus-update")
    {
        if ($argList.Count -gt 1)
        {
            $argList = $argList[1..($argList.Length - 1)]
        }
        else
        {
            $argList = @()
        }
        argParse $argList
        update
        exitHandler 0
    }
    else
    {
        embeddedScript $argList
    }
}

main $args
