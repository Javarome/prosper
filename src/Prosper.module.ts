import {NgModule} from "@angular/core";
import {FormsModule} from "@angular/forms";
import {BrowserModule} from "@angular/platform-browser";
import {Prosper} from "./Prosper.component";
import {ProsperGraph} from "./ProsperGraph.component";
import {ProsperInput} from "./ProsperInput.component";

import {ProsperOutput} from "./ProsperOutput.component";

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [Prosper, ProsperOutput, ProsperInput, ProsperGraph],
  bootstrap: [Prosper]
})
export class ProsperModule {
}
