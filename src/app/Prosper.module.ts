import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {ProsperComponent} from './ProsperComponent';
import {ProsperGraphComponent} from './ProsperGraphComponent';
import {ProsperInputComponent} from './ProsperInputComponent';

import {ProsperOutputComponent} from './ProsperOutputComponent';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [ProsperComponent, ProsperOutputComponent, ProsperInputComponent, ProsperGraphComponent],
  providers: [],
  bootstrap: [ProsperComponent]
})
export class ProsperModule {
}
