import {Component, NgModule, VERSION} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {Prosper} from "./Prosper.component.ts";
import {ProsperGraph} from "./ProsperGraph.component.ts";
import {ProsperInput} from "./ProsperInput.component.ts";

import {ProsperOutput} from "./ProsperOutput.component.ts";

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [Prosper, ProsperOutput, ProsperInput, ProsperGraph],
  bootstrap: [Prosper]
})
export class ProsperModule {
}