# UI Perspective Display Logic

Acest cod JavaScript poate fi folosit în componenta UI pentru a detecta și afișa corect perspectivele cu etichetele lor.

## Funcție pentru procesarea perspectivelor

```javascript
/**
 * Procesează o perspectivă și extrage eticheta dacă există
 * @param {string} perspective - Textul perspectivei
 * @param {number} index - Index-ul perspectivei (0-2)
 * @returns {object} - Obiect cu label și text
 */
function processPerspective(perspective, index) {
    // Pattern pentru detectarea etichetelor comune
    // Caută cuvinte cheie urmate de două puncte
    const labelPattern = /^([^:]+(?:View|Experience|Analysis|Lens|Insights|Perspective|Opinion|Take|Assessment|Angle|Impact|Outlook)[^:]*):(.+)/i;
    
    const match = perspective.match(labelPattern);
    
    if (match) {
        // Perspectivă cu etichetă detectată
        return {
            label: match[1].trim(),
            text: match[2].trim()
        };
    }
    
    // Fără etichetă - folosește etichete implicite
    const defaultLabels = ['PERSPECTIVE 1', 'PERSPECTIVE 2', 'PERSPECTIVE 3'];
    return {
        label: defaultLabels[index],
        text: perspective
    };
}

/**
 * Procesează toate perspectivele dintr-un post
 * @param {array} reactions - Array de perspective/reacții
 * @returns {array} - Array de obiecte cu label și text
 */
function processReactions(reactions) {
    if (!reactions || !Array.isArray(reactions)) {
        return [];
    }
    
    return reactions.map((reaction, index) => processPerspective(reaction, index));
}
```

## Exemplu de utilizare în componenta Story Card

```javascript
// În story-card.js presenter

class StoryCard {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        
        // ... alte inițializări ...
    }
    
    renderReactions(post) {
        if (!post.reactions || post.reactions.length === 0) {
            return '';
        }
        
        // Procesează perspectivele pentru a extrage etichetele
        const processedReactions = processReactions(post.reactions);
        
        // Generează HTML pentru perspective
        return processedReactions.map((reaction, index) => `
            <div class="reaction-item">
                <h4 class="reaction-label">${reaction.label}</h4>
                <p class="reaction-text">${reaction.text}</p>
            </div>
        `).join('');
    }
    
    // ... alte metode ...
}
```

## Exemplu de CSS pentru stilizare

```css
.reaction-item {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
}

.reaction-label {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--primary-color);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.reaction-text {
    font-size: 1rem;
    line-height: 1.6;
    color: var(--text-color);
}
```

## Alternative de etichete

Funcția detectează automat următoarele tipuri de etichete:
- Engineer's View
- User Experience
- Industry Analysis
- Investor Lens
- Market Impact
- Technical Perspective
- Business Insights
- Strategic Outlook
- Customer Opinion
- Expert Take
- Security Assessment
- Performance Angle

## Exemplu de output

### Input (din posts.json):
```json
{
    "reactions": [
        "Investor Lens: This startup shows strong potential for scalability...",
        "Technical Analysis: The architecture demonstrates solid engineering...",
        "Market Impact: This could reshape how companies approach..."
    ]
}
```

### Output processat:
```javascript
[
    {
        label: "Investor Lens",
        text: "This startup shows strong potential for scalability..."
    },
    {
        label: "Technical Analysis", 
        text: "The architecture demonstrates solid engineering..."
    },
    {
        label: "Market Impact",
        text: "This could reshape how companies approach..."
    }
]
```

### Dacă nu sunt detectate etichete:
```javascript
[
    {
        label: "PERSPECTIVE 1",
        text: "Full text of the first perspective..."
    },
    {
        label: "PERSPECTIVE 2",
        text: "Full text of the second perspective..."
    },
    {
        label: "PERSPECTIVE 3",
        text: "Full text of the third perspective..."
    }
]
```