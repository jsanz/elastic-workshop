#!/bin/bash

count=1
input="airports.ldjson"

while IFS= read -r line
do
    echo "{ \"index\" : { \"_index\" : \"workshop_airports\", \"_id\" : \"${count}\" } }"
    echo "$line"
    (( count++ ))
done < "$input"