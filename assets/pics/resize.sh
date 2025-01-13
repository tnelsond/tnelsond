#/bin/sh

gmic -input $1 -resize3dx ${2:-600}  -output $1.jpg,${3:-85}
