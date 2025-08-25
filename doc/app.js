import WebSkel from './WebSkel/webskel.mjs';
import LoadingIndicator from './components/base/loading-indicator/loading-indicator.js';
import './services/ThemeManager.js';

async function start() {
    const webSkel = await WebSkel.initialise('webskel.json');
    webSkel.setDomElementForPages(document.querySelector('#app'));

    // Load core services
    await import('./services/LocalStorage.js');

    // Make LoadingIndicator globally available
    window.LoadingIndicator = LoadingIndicator;
    
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
    }, 500);

    await webSkel.changeToDynamicPage('news-feed-page', 'app');
}

start();
