#! /bin/bash
#
# Run this from project root.
#
# This script pulls down the files referenced in src/macros/build.sh:
# timeseries.json, features.json, locations.json.  It creates fake
# placeholder files for report.json and ratings.json, because at the
# moment Li doesn't create a corresponding file.

echo 'Replacing existing reports in dist with all reports downloaded from li s3.'
echo

# Bucket names pulled from Li aws.
stagingBucket=listaging-reportsbucket-1bjqfmfwopcdd
productionBucket=liproduction-reportsbucket-bhk8fnhv1s76

rm -rf dist
mkdir -p dist
pushd dist

bucketName="$productionBucket"
key=v1/latest

echo "pulling files from ${bucketName}/${key}"
for f in latest.csv latest.json timeseries.json features.json locations.json timeseries-byLocation.json timeseries.csv timeseries-jhu.csv; do
    echo "  $f"
    aws --no-sign-request --region=us-west-1 s3 cp s3://${bucketName}/${key}/${f} .
done

echo "Creating stub files for missing reports:"
echo {} > report.json
echo [] > ratings.json

popd
ls -1 dist

echo
echo "done."
