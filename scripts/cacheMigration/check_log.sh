# Run this from project root.

echo "Results from log.txt:"

echo
echo "Count of 'Error processing':"
grep "Error processing" log.txt | wc -l

echo
echo "Count of 'Cache miss' for 'filepath: cache':"
grep "Cache miss for" log.txt | grep "filepath: cache/" | wc -l

echo
echo "Count of 'Cache miss' NOT for 'filepath: cache':"
grep "Cache miss for" log.txt | grep -v "filepath: cache/" | wc -l

echo
echo "Count of filepath errors (need to fix instrumentation)"
grep "_filepath" log.txt | wc -l

