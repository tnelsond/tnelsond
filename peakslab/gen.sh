#!/bin/bash

u=${str^^}
sed -e "s/khmer/$1/g; s/Khmer/$u/g;" khmer.html > $1.html
