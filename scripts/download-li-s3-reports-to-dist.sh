#! /bin/bash
#
# Run this from project root.

echo 'Replacing existing reports in dist with all reports downloaded from li s3.'
echo "Note: paths are HARD-CODED to staging buckets currently!"
echo

# Bucket names pulled from Li aws.
stagingBucket=listaging-reportsbucket-1bjqfmfwopcdd
productionBucket=liproduction-reportsbucket-bhk8fnhv1s76

rm -rf dist
mkdir -p dist
pushd dist

bucketName="$stagingBucket"
key=v1/latest

echo "pulling files from ${bucketName}/${key}"
aws --no-sign-request --region=us-west-1 s3 cp s3://${bucketName}/${key} . --recursive

popd
ls -1 dist

echo
echo "done."
