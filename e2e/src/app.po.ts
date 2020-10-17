import {browser, by, element} from 'protractor';

export class AppPage {

  navigateTo(): Promise<unknown> {
    return browser.get(browser.baseUrl) as Promise<unknown>;
  }

  getInputLabelText(): Promise<string> {
    return element(by.css('prosper prosper-input label[for="prosper-input"]')).getText() as Promise<string>;
  }
}
