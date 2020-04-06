#!/bin/bash
# Run this in the project root directory!

# Clear out logs.
rm ./scripts/cacheMigration/cacheCalls.txt
rm ./log.txt

for dt in `ls -1 coronadatascraper-cache/`
do
    echo "Running $dt"
    cmd="yarn fetchOnly --date '$dt' --onlyUseCache"
    echo $cmd
    echo "   ... running, piping output to log.txt"
    echo "===============================" >> log.txt
    echo "$dt" >> log.txt
    `$cmd >> log.txt 2>&1`
done


echo "Done, please check scripts/cacheMigration/cacheCalls.txt and log.txt."
