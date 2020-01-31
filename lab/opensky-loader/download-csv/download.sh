#!/bin/bash

filename=opensky_$(date "+%Y-%m-%d_%H_%M").csv
echo "Writing to ${filename}"


cat data_header.csv > ${filename}
while true; do 
	echo "Downloading... ($(date))";
	curl -sL "https://opensky-network.org/api/states/all" \
	  | jq -c ".states[]" \
	  | sed -e 's/^\[//g' -e 's/\]$//g' \
	  >> ${filename} 
	echo "Done, sleeping 60 seconds" 
	sleep 60
done