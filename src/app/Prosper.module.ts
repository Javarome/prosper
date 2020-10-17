import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {ProsperComponent} from './ProsperComponent';
import {ProsperInputComponent} from "./input/ProsperInputComponent";
import {ProsperOutputComponent} from "./output/ProsperOutputComponent";
import {ProsperGraphComponent} from "./output/graph/ProsperGraphComponent";

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [ProsperComponent, ProsperOutputComponent, ProsperInputComponent, ProsperGraphComponent],
  providers: [],
  bootstrap: [ProsperComponent]
})
export class ProsperModule {
}
