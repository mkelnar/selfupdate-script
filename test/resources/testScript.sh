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

for i in "$@"; do
  case $i in
  -h | --help)
    echo "This is test script."
    echo "  --force             Force."
    exit 0
    ;;
  -v | --version)
    echo "testscript v1.0.0"
    exit 0
    ;;
  -*)
    logError "Unknown option $i"
    exit 1
    ;;
  *) ;;
  esac
done
