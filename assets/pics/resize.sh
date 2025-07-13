#/bin/sh

for f in $@; do

gmic -input $f -rs 700  -output $f,55	
done;
