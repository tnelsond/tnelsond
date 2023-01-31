#/bin/sh

gmic -input $1 -resize3dx ${2:-200}  -output $1,${3:-80}
