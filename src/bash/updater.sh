#!/usr/bin/env bash
# * ********************************************************************************************************* *
# *
# * Copyright 2022 Michal Kelnar
# *
# * SPDX-License-Identifier: BSD-3-Clause
# * The BSD-3-Clause license for this file can be found in the LICENSE.txt file included with this distribution
# * or at https://spdx.org/licenses/BSD-3-Clause.html#licenseText
# *
# * ********************************************************************************************************* *
version=20220200
updateUrl="https://hub.dev.oidis.io/Configuration/com-wui-framework-services/BaseInstallationRecipe/2019.0.0"
isDryRun=0
isForce=0
tmpScript=/tmp/autoupdatescript-$(date '+%s').sh
logFile=/tmp/autoupdatescript.log
sourceFile=$0

function log() {
  echo "$1"
  echo "[$(date -u)][INFO]: $1" >>$logFile
}

function logError() {
  echo "$1" >>/dev/stderr
  echo "[$(date -u)][ERROR]: $1" >>$logFile
}

function exitHandler() {
  log "Clean up before exit: $1"
  rm -f "$tmpScript"
  exit "$1"
}

function download() {
  if [ -x "$(command -v curl)" ]; then
    log "Download by curl from: $updateUrl"
    if ! [[ $isDryRun == 1 ]]; then
      curl -fsSL "$updateUrl" >"$tmpScript"
    fi
  else
    log "Download by wget from: $updateUrl"
    if ! [[ $isDryRun == 1 ]]; then
      wget -O "$tmpScript" "$updateUrl"
    fi
  fi

  if [[ $isDryRun == 1 ]]; then
    cp -p "$sourceFile" "$tmpScript"
  fi

  log "Downloaded content: $tmpScript"
  if [ -f "$tmpScript" ]; then
    log "New script downloaded: $tmpScript"
  else
    logError "Failed to download new script"
    exitHandler -1
  fi
}

function update() {
  log "**********  Automatic update of this executor script content starting  **********"
  if ! [[ $isForce == 1 ]]; then
    # todo add some countdown (10s) to let user choose Y/n question here
    echo "TBD"
  fi
  if [[ $isDryRun == 1 ]]; then
    log "Utility is executed in dry-run mode, this will only print steps without any modification"
  fi

  download
  validate "$tmpScript"

  log "Create backup into $sourceFile.backup"
  cp -pf "$sourceFile" "$sourceFile.backup" || exitHandler -1

  log "Overwrite current file by downloaded script"
  if ! [[ $isDryRun == 1 ]]; then
    cp -pf "$tmpScript" "$sourceFile" || exitHandler -1
    chmod +x "$sourceFile"
  fi

  validate "$sourceFile"

  log "Script update succeed"
}

function validate() {
  # this function should fail and exit if not succeed, update will continue otherwise
  log "Validate downloaded script: $1 --version"
  chmod +x "$1"
  $1 sus-update --version || exitHandler -1
}

function help() {
  echo "Self update script utility is able to wrap custom script byt self updating feature from new content"
  echo "Usage: {script-name} sus-update [options]"
  echo "Options below are applicable only when sus-update sub-command is used for script invocation."
  echo "Any other invocation is directly redirected to custom script (TBD)"
  echo "  -v|--version       Prints selfupdate-script version"
  echo "  -h|--help          Prints selfupdate-script help"
  echo "  --get-url          Prints internally defined update url"
  echo "  --update-url=<>    Specify overwrite for internally defined update url"
  echo "  --dry-run          Use this for validation purposes, it will do everything except download
                             from url (mocked copy of itself will be validated) and original script overwrite"
  echo "  --force            Force do the script update without any user prompts."
  echo "  sus-update         Overwrite itself by new content"
}

function argParse() {
  for i in "$@"; do
    case $i in
    -h | --help)
      help
      exit 0
      ;;
    --get-url)
      echo $updateUrl
      exit 0
      ;;
    --dry-run)
      isDryRun=1
      shift
      ;;
    --update-url=*)
      updateUrl="${i#*=}"
      shift
      ;;
    --force)
      isForce=1
      shift
      ;;
    -v | --version)
      echo $version
      exit 0
      ;;
    -* | *)
      logError "Unknown option $i"
      help
      exit 1
      ;;
    esac
  done
}

function embeddedScript() {
  ## BEGIN - selfupdate-script embedded content
  echo "Invocation of embedded script"
  ## END - selfupdate-script embedded content
}

function main() {
  if [[ $1 == "sus-update" ]]; then
    shift

    argParse "$@"
    update
    exitHandler 0
  else
    embeddedScript "$@"
  fi
}

main "$@"
