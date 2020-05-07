#!/bin/bash

# Run this script from project root.

# Regression/generation of reports
#
# 1. Generate reports to zz-master using 'yarn raw:*' methods
# 2. Generate reports to dist using 'yarn start'
# 3. Export raw files from li end gen reports to zz-combined using 'yarn raw:combined'
# 4. Compare them.
#
# Assumptions:
#
# * li is in a sibling directory to cds
# * li is checked out to a branch that has tools/gen-raw-files and associated changes

lifilt=''
cdsfilt=''

if [ "$1" == "sf" ]; then
    lifilt='-s us-ca-san-francisco-county'
    cdsfilt='--location US/CA/san-francisco-county.js'
fi

if [ "$1" == "ut" ]; then
    lifilt='-s us-ut'
    cdsfilt='--location US/UT'
fi

# Delete all so things aren't polluted.
rm -rf dist dist-raw dist-raw-li zz-combined zz-master

# 1. Run master with raw files, generating to zz-master
yarn raw:scrape $cdsfilt
yarn raw:report --writeTo zz-master

# 2. Run regular master, generating reports to dist
yarn start --writeTo $cdsfilt

# 3. Export files from Li, and run the 'combined' report to zz-combined.
pushd ../li
node tools/gen-raw-files.js -c -o ../coronadatascraper/dist-raw-li $lifilt
popd
yarn raw:reportcombined --writeTo zz-combined

# 4. COMPARE!
echo ==================================================
echo 'DIST to ZZ-MASTER'
node tools/compare-report-dirs.js --left dist --right zz-master
echo ==================================================
echo 'DIST to ZZ-COMBINED'
node tools/compare-report-dirs.js --left dist --right zz-combined
echo ==================================================
