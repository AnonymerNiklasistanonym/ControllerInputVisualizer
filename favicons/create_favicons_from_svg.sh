#!/usr/bin/env bash

# Declare an array with the png image sizes to export
array=( 192 256 )
for i in "${array[@]}"
do
	# Export each size as a `png` favicon from `favicon.svg`
	inkscape favicon.svg -o "favicon_${i}.png" -w "$i" -h "$i"
done

# Create ico image
convert -background none favicon.svg -define icon:auto-resize=64,48,32,16 favicon.ico
