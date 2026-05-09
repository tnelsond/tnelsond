#/bin/sh

for f in $@; do

magick $f -auto-orient $f
gmic -input $f -rs 700  -output ${f%.*}0.jpg,68	
done;
