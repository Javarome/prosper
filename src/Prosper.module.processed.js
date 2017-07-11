"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else
      for (var i = decorators.length - 1; i >= 0; i--)
        if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
  };
exports.__esModule = true;
//our root app component
var core_1 = require("@angular/core");
var platform_browser_1 = require("@angular/platform-browser");
var forms_1 = require("@angular/forms");
var ProsperOutput_1 = require("./ProsperOutput");
var ProsperInput_1 = require("./ProsperInput");
var ProsperGraph_1 = require("./ProsperGraph");
var Prosper = (function () {
  function Prosper() {
    this.inputs = [];
    this.outputs = [];
  }

  Prosper.prototype.log = function (msg) {
    console.log("Prosper: " + msg);
  };
  Prosper.prototype.addInput = function (input) {
    this.inputs.push(input);
  };
  Prosper.prototype.addOutput = function (output) {
    this.outputs.push(output);
  };
  Prosper.prototype.setMemory = function (memory) {
    this.memory = memory;
  };
  Prosper.prototype.input = function (value) {
    this.memory.input(value);
    this.outputs.forEach(function (output) {
      return output.input(value);
    });
  };
  Prosper.prototype.output = function (preds) {
    this.outputs.forEach(function (output) {
      return output.output(preds);
    });
  };
  Prosper.prototype.reset = function () {
    this.outputs.forEach(function (output) {
      return output.reset();
    });
  };
  Prosper.prototype.refresh = function () {
    memory.refresh();
    ;
  };
  return Prosper;
}());
Prosper = __decorate([
  core_1.Component({
    selector: 'prosper',
    template: "\n    <prosper-output [prosper]=\"this\"></prosper-output>\n    <prosper-input  [prosper]=\"this\" id=\"prosperInput\"></prosper-input>\n    <prosper-graph  [prosper]=\"this\" input=\"prosperInput\" id=\"prosper-graph\"></prosper-graph>\n  "
  })
], Prosper);
exports.Prosper = Prosper;
var ProsperModule = (function () {
  function ProsperModule() {
  }

  return ProsperModule;
}());
ProsperModule = __decorate([
  core_1.NgModule({
    imports: [platform_browser_1.BrowserModule, forms_1.FormsModule],
    declarations: [Prosper, ProsperOutput_1.ProsperOutput, ProsperInput_1.ProsperInput, ProsperGraph_1.ProsperGraph],
    bootstrap: [Prosper]
  })
], ProsperModule);
exports.ProsperModule = ProsperModule;