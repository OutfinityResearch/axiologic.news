export class TextService {
    static adjustFontSize(element) {
        if (!element || !element.parentElement) {
            return;
        }

        const container = element.parentElement;
        let fontSize = 50; // Max font size in pixels
        const minFontSize = 12; // Min font size
        const step = 1; // Step to decrease font size

        element.style.fontSize = `${fontSize}px`;

        // Iteratively reduce font size until the text fits within the container
        while ((element.scrollHeight > container.clientHeight || element.scrollWidth > container.clientWidth) && fontSize > minFontSize) {
            fontSize -= step;
            element.style.fontSize = `${fontSize}px`;
        }

        // Apply text alignment based on content length and element type
        if (element.classList.contains('title')) {
            element.style.textAlign = 'center';
        } else {
            if (element.textContent.length > 150) {
                element.style.textAlign = 'justify';
            } else {
                element.style.textAlign = 'center';
            }
        }
    }
}
