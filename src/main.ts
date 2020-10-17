import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {environment} from './environments/environment';
import {ProsperModule} from './app/Prosper.module';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(ProsperModule)
  .catch(err => console.error(err));
