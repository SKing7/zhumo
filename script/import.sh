# drop all collections
dir=`dirname $0`

echo "drop previous data..."
mongo < $dir/drop.js > /dev/null 2>&1

# unzip new data
unzip $dir/daybook.zip > /dev/null 2>&1

# import new data
echo "import new data..."
for collection in users companies transactions accounts categories feedbacks
    do mongoimport --db daybook --collection $collection --file ${dir}/${collection}.json > /dev/null 2>&1
done

# remove new data
rm $dir/*.json

echo "done"
