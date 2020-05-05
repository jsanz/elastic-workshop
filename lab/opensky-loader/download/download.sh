#!/bin/bash

filename_base=flight_tracking_$(date "+%Y-%m-%d_%H_%M")

csv_file="${filename_base}.csv"
geojson_file="${filename_base}.geojson"

if [ -z "$1" ]
  then
    echo "No iterations provided, we'll do 5"
    iterations=5
else
  iterations=$1
  echo "Iterating ${iterations} times"
fi

echo "Writing to ${csv_file}"
cat data_header.csv > ${csv_file}
for i in $(seq 1 ${iterations}); do 
    echo "[${i}] Downloading... ($(date))";
    curl -sL "https://opensky-network.org/api/states/all" \
      | jq -c ".states[]" \
      | sed -e 's/^\[//g' -e 's/\]$//g' \
      >> ${csv_file}
    if [ $i -ne $iterations ]; then
      echo "Done, sleeping 60 seconds" 
      sleep 60
    else
      echo "Finished downloading"
    fi
done

echo "Generating the GeoJSON file: ${geojson_file}"
ogr2ogr -f GeoJSON ${geojson_file} \
  -oo "X_POSSIBLE_NAMES=Lon*" \
  -oo "Y_POSSIBLE_NAMES=Lat*" \
  -oo KEEP_GEOM_COLUMNS=NO \
  ${csv_file}
