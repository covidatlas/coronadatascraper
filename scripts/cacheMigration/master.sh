#!/bin/bash

# MASTER SCRIPT: Run this in the root directory.
#
# NOTE: You should currently be on the prep-cache-call-logging branch.
#
# Usage: ./scripts/cacheMigration/master.sh <migration-branch-name>
# eg
# ./scripts/cacheMigration/master.sh wip-my-migration-branch

# Prep migration branch
git checkout -b $1
git pull upstream master --recurse-submodules

# Auto-migrate code and save it
pushd ./scripts/cacheMigration
ruby cache-migration-hacks.rb save

# Run scrape, gen reports
popd
./scripts/cacheMigration/run-dates.sh
ruby scripts/cacheMigration/compare-log-to-actual-files.rb > cache_comparison.txt
./scripts/cacheMigration/check_log.sh > log_error_check.txt

echo "Done: check files: scripts/cacheMigration/cacheCalls.txt, and .txt files in root (log, log_error_check, cache_comparison)"
