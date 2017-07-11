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
var ProsperOutput = (function () {
  function ProsperOutput($element) {
    this.$element = $element;
  }

  ProsperOutput.prototype.reset = function () {
    console.log('output reset');
  };
  ProsperOutput.prototype.ngOnInit = function () {
    this.prosper.addOutput(this);
  };
  ProsperOutput.prototype.input = function (value) {
    this.latestInput += this.SEP + value;
    this.SEP = ' ';
  };
  ProsperOutput.prototype.ngAfterContentInit = function () {
    this.outputElem = this.$element.nativeElement.querySelector('output');
    this.SEP = '';
    this.latestInput = '';
  };
  ProsperOutput.prototype.output = function (prediction) {
    var _this = this;
    var questionElem = document.createElement('div');
    questionElem.classList.add('question');
    questionElem.append(this.latestInput);
    this.outputElem.append(questionElem);
    var answer = '';
    this.SEP = '';
    prediction.forEach(function (p) {
      answer += _this.SEP + p;
    });
    if (!answer) {
      answer = '...';
    }
    var answerElem = document.createElement('div');
    answerElem.classList.add('answer');
    answerElem.append(answer);
    this.outputElem.append(answerElem);
    this.outputElem.append(answerElem);
    this.latestInput = '';
    this.outputElem.querySelector('.answer:last-child').scrollIntoView();
  };
  return ProsperOutput;
}());
__decorate([
  core_1.Input()
], ProsperOutput.prototype, "prosper");
ProsperOutput = __decorate([
  core_1.Component({
    selector: 'prosper-output',
    template: '<output></output>'
  })
], ProsperOutput);
exports.ProsperOutput = ProsperOutput;