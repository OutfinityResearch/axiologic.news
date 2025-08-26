#!/bin/bash

# Script pentru curățarea tuturor fișierelor generate
# Păstrează doar config.json în fiecare categorie; șterge posts.json, backup-urile și .history.json

echo "🧹 Curățare fișiere generate în toate directoarele..."
echo ""

# Găsește toate directoarele care au config.json
for dir in */; do
    if [ -f "${dir}config.json" ]; then
        echo "📁 ${dir}"
        # Șterge toate fișierele din director cu excepția config.json
        for f in "${dir}"*; do
            base=$(basename "$f")
            if [ "$base" != "config.json" ]; then
                if [ -f "$f" ]; then
                    rm -f "$f"
                    echo "  ✖ Șters: $f"
                fi
            fi
        done
        echo "  ✓ Păstrat: ${dir}config.json"
        echo
    fi
done

echo "✅ Curățare completă!"
echo ""
echo "Pentru a regenera postările, rulează:"
echo "  node generate-ai.js all"
echo ""
echo "Sau pentru o categorie specifică:"
echo "  node generate-ai.js [categorie]"
