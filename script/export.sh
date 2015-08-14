dir=`dirname $0`

# remove old archive
echo "drop old archive..."
rm $dir/daybook.zip

# export all collections
echo "export all collections..."
for collection in users companies transactions accounts categories feedbacks
    do mongoexport --db daybook --collection $collection --out ${dir}/${collection}.json --journal > /dev/null 2>&1
done

# create new archive
echo "create new archive..."
zip $dir/daybook.zip $dir/*.json > /dev/null 2>&1
rm $dir/*.json

echo "done"
