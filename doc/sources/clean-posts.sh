#!/bin/bash

# Script pentru curățarea tuturor fișierelor posts.json
# Resetează toate postările la array gol pentru testare de la zero

echo "🧹 Curățare posts.json în toate directoarele..."
echo ""

# Găsește toate directoarele care au config.json
for dir in */; do
    if [ -f "${dir}config.json" ]; then
        posts_file="${dir}posts.json"
        
        # Verifică dacă există posts.json
        if [ -f "$posts_file" ]; then
            # Salvează backup dacă are conținut
            if [ -s "$posts_file" ]; then
                backup_file="${dir}posts.backup.$(date +%Y%m%d_%H%M%S).json"
                cp "$posts_file" "$backup_file"
                echo "✓ Backup salvat: $backup_file"
            fi
            
            # Resetează la array gol
            echo '[]' > "$posts_file"
            echo "✓ Curățat: $posts_file"
        else
            # Creează posts.json gol dacă nu există
            echo '[]' > "$posts_file"
            echo "✓ Creat gol: $posts_file"
        fi
        
        # Șterge și history dacă există
        history_file="${dir}.history.json"
        if [ -f "$history_file" ]; then
            rm "$history_file"
            echo "✓ Șters history: $history_file"
        fi
        
        echo ""
    fi
done

echo "✅ Curățare completă!"
echo ""
echo "Pentru a regenera postările, rulează:"
echo "  node generate-ai.js all"
echo ""
echo "Sau pentru o categorie specifică:"
echo "  node generate-ai.js [categorie]"