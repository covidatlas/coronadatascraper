#!/bin/bash

rm log.txt

for d in `ls -1 coronadatascraper-cache`; do
    echo "Running $d ..."
    echo '------------------------------------------------------------' >> log.txt
    echo $d >> log.txt
    MIGRATE_CACHE_DIR=zztest yarn start --onlyUseCache -d $d >> log.txt 2>&1
done
