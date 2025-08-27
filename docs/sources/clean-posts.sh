#!/bin/bash

for dir in */; do
    if [ -f "${dir}config.json" ]; then
        echo "📁 ${dir}"
        for f in "${dir}"*; do
            base=$(basename "$f")
            if [ "$base" != "config.json" ]; then
                if [ -f "$f" ]; then
                    rm -f "$f"
                    echo "  ✖ Deleting: $f"
                fi
            fi
        done
        echo "  ✓ Keeping: ${dir}config.json"
        echo
    fi
done

