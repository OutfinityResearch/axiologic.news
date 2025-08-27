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

    const btnSmall = this.element.querySelector('#text-small');
    const btnMedium = this.element.querySelector('#text-medium');
    const btnLarge = this.element.querySelector('#text-large');
    const btnXLarge = this.element.querySelector('#text-xlarge');

    const applyActive = () => {
      const scale = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--content-scale') || '1');
      btnSmall?.classList.toggle('active', Math.abs(scale - 0.9) < 0.01);
      btnMedium?.classList.toggle('active', Math.abs(scale - 1.0) < 0.01);
      btnLarge?.classList.toggle('active', Math.abs(scale - 1.15) < 0.01);
      btnXLarge?.classList.toggle('active', Math.abs(scale - 1.3) < 0.01);
    };

    const setScale = async (value) => {
      document.documentElement.style.setProperty('--content-scale', String(value));
      await window.LocalStorage.set('contentScale', value);
      applyActive();
    };

    btnSmall?.addEventListener('click', () => setScale(0.9));
    btnMedium?.addEventListener('click', () => setScale(1.0));
    btnLarge?.addEventListener('click', () => setScale(1.15));
    btnXLarge?.addEventListener('click', () => setScale(1.3));

    applyActive();
  }
}
