#!/bin/bash

# Run this from the root dir.
# Fetch and commit last coronadatascraper-cache/ ref on origin/master.

if [ "$1" == "" ]; then
    echo "Please specify a branch name."
    exit 0
fi

git checkout master -b "$1"

pushd coronadatascraper-cache/
git checkout master
git pull origin master
popd

git st
git add coronadatascraper-cache/
git commit -m "Update cache ref only."
