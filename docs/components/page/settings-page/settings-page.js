export class SettingsPage {
  constructor(element, invalidate) {
    this.element = element;
    this.invalidate = invalidate;
    this.invalidate();
  }

  async beforeRender() {}

  afterRender() {
    const back = this.element.querySelector('#back-button');
    if (back) back.addEventListener('click', () => window.webSkel.changeToDynamicPage('news-feed-page','app'));

    const btnLight = this.element.querySelector('#theme-light');
    const btnDark = this.element.querySelector('#theme-dark');

    const applyActive = () => {
      const current = document.documentElement.getAttribute('data-theme');
      btnLight?.classList.toggle('active', current === 'light');
      btnDark?.classList.toggle('active', current === 'dark');
    };

    btnLight?.addEventListener('click', () => { window.ThemeManager?.setTheme('light'); applyActive(); });
    btnDark?.addEventListener('click', () => { window.ThemeManager?.setTheme('dark'); applyActive(); });

    applyActive();
  }
}
