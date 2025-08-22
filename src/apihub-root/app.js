import WebSkel from '../WebSkel/webskel.mjs';
import LoadingIndicator from './components/base/loading-indicator/loading-indicator.js';

async function start() {
    const webSkel = await WebSkel.initialise('webskel.json');
    webSkel.setDomElementForPages(document.querySelector('#app'));

    // Load core services
    await import('./services/LocalStorage.js');
    await import('./services/FileStorage.js');
    await import('./services/LLMAdapter.js');
    await import('./services/TTSService.js');
    await import('./services/PromptService.js');
    await import('./services/AnimationService.js');
    await import('./services/BackgroundMusicService.js');
    const { TextService } = await import('./services/TextService.js');
    const { RobustTextService } = await import('./services/RobustTextService.js');
    webSkel.textService = TextService;
    webSkel.robustTextService = RobustTextService;

    // Make LoadingIndicator globally available
    window.LoadingIndicator = LoadingIndicator;

    // Dynamically create and inject the hamburger menu after WebSkel is initialized
    const hamburgerMenu = document.createElement('hamburger-menu');
    hamburgerMenu.setAttribute('data-presenter', 'hamburger-menu');
    document.body.prepend(hamburgerMenu);

    // Add a manual click listener for the hamburger button
    const hamburgerButton = document.querySelector('#hamburger-button');
    if (hamburgerButton) {
        hamburgerButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await hamburgerMenu.presenterReadyPromise;
            // The presenter should now be attached to the element
            if (hamburgerMenu.webSkelPresenter) {
                hamburgerMenu.webSkelPresenter.toggle();
            } else {
                console.error('Hamburger menu presenter not found');
            }
        });
    }

    await webSkel.changeToDynamicPage('news-feed-page', 'app');
    window.webSkel = webSkel;
}

start();
