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
var core_1 = require("@angular/core");
var ProsperInput = (function () {
  function ProsperInput($element) {
    this.$element = $element;
    this.value = '';
    this.speed = 0;
    this.sampleCharsType = {
      value: 'chars',
      label: 'Chars'
    };
    this.sampleWordsType = {
      value: 'words',
      label: 'Words'
    };
    this.items = [this.sampleCharsType, this.sampleWordsType];
    this.sampleType = this.sampleCharsType;
  }

  ProsperInput.prototype.log = function (msg) {
    console.log("ProsperInput: " + msg);
  };
  ProsperInput.prototype.ngOnInit = function () {
    this.prosper.addInput(this);
  };
  ProsperInput.prototype.sampleChars = function (value) {
    return value.split('');
  };
  ProsperInput.prototype.sampleWords = function (value) {
    return value.split(' ');
    /*const splits = [];
     let from = 0;
     let spaceFound;
     let spacePos = 0;
     do {
     spacePos = value.indexOf(' ', from);
     spaceFound = spacePos >= 0;
     if (!spaceFound) {
     spacePos = value.length;
     }
     splits.push(value.substring(from, spacePos));
     if (spaceFound) {
     splits.push(' ');
     }
     from = spacePos + 1;
     } while (spaceFound);
     return splits;*/
  };
  ProsperInput.prototype.reset = function () {
    this.prosper.reset();
  };
  ProsperInput.prototype.refresh = function () {
    this.prosper.refresh();
  };
  ProsperInput.prototype.submit = function () {
    var _this = this;
    var sample = this.sampleType === this.sampleCharsType ? this.sampleChars : this.sampleWords;
    var values = sample(this.value);
    // this.$rootScope.$emit("prosperInput", Date.now().toString());
    var i = 0;
    values.forEach(function (value) {
      setTimeout(function () {
        return _this.prosper.input(value);
      }, _this.speed * i++);
    });
    this.value = '';
    this.$element.nativeElement.querySelector('input').focus();
  };
  return ProsperInput;
}());
__decorate([
  core_1.Input()
], ProsperInput.prototype, "prosper");
ProsperInput = __decorate([
  core_1.Component({
    selector: 'prosper-input',
    templateUrl: '/src/ProsperInput.html'
  })
], ProsperInput);
exports.ProsperInput = ProsperInput;