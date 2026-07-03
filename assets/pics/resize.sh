#/bin/sh

for f in $@; do

magick "$f" -auto-orient -resize 700x -quality 68 "${f%.*}.webp"

done;
