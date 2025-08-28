import WebSkel from './WebSkel/webskel.mjs';
import LoadingIndicator from './components/base/loading-indicator/loading-indicator.js';
import './services/ThemeManager.js';

async function start() {
    const webSkel = await WebSkel.initialise('webskel.json');
    webSkel.setDomElementForPages(document.querySelector('#app'));
    
    // Remove initial loading spinner
    const initialSpinner = document.querySelector('.initial-spinner');
    if (initialSpinner) {
        setTimeout(() => {
            initialSpinner.style.opacity = '0';
            initialSpinner.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                initialSpinner.close();
                initialSpinner.remove();
            }, 300);
        }, 100);
    }

    // Load core services
    await import('./services/LocalStorage.js');
    await import('./services/SourcesManager.js');

    // Make LoadingIndicator globally available
    window.LoadingIndicator = LoadingIndicator;
    // Apply saved content scale (font size) early
    try {
        const savedScale = await window.LocalStorage.get('contentScale');
        const scale = typeof savedScale === 'number' ? savedScale : 1.0;
        document.documentElement.style.setProperty('--content-scale', String(scale));
    } catch (e) {
        document.documentElement.style.setProperty('--content-scale', '1');
    }

    // Store webSkel globally first
    window.webSkel = webSkel;

    // Create hamburger menu element inside mobile container to simulate phone overlay
    const hamburgerMenu = document.createElement('hamburger-menu');
    hamburgerMenu.setAttribute('data-presenter', 'hamburger-menu');
    const mobileContainer = document.querySelector('.mobile-container');
    if (mobileContainer) {
        mobileContainer.prepend(hamburgerMenu);
    } else {
        document.body.prepend(hamburgerMenu);
    }
    
    // Initialize hamburger menu functionality after a delay
    setTimeout(() => {
        const hamburgerButton = document.querySelector('#hamburger-button');
        const menu = document.querySelector('hamburger-menu');
        const refreshButton = document.querySelector('#refresh-button');
        
        if (hamburgerButton && menu) {
            hamburgerButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Simple toggle using the presenter if available
                if (menu.webSkelPresenter && menu.webSkelPresenter.toggle) {
                    menu.webSkelPresenter.toggle();
                } else {
                    // Fallback: toggle a class
                    menu.classList.toggle('open');
                }
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', async (e) => {
                e.preventDefault();
                // Optional visual feedback
                refreshButton.classList.add('spinning');
                try {
                    // Re-render the feed page to force a fresh fetch
                    await window.webSkel.changeToDynamicPage('news-feed-page', 'app');
                } finally {
                    refreshButton.classList.remove('spinning');
                }
            });
        }
    }, 500);

    await webSkel.changeToDynamicPage('news-feed-page', 'app');
}

start();
