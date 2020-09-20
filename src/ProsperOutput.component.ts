import {AfterContentInit, Component, ElementRef, Input, OnInit} from "@angular/core";

import {Prosper} from "./Prosper.component";

@Component({
  selector: 'prosper-output',
  template: '<output></output>',
  styleUrls: ['ProsperOutput.component']
})
export class ProsperOutput implements OnInit, AfterContentInit {
  @Input() private prosper: Prosper;

  private SEP;
  private latestInput;
  private outputElem;

  constructor(private $element: ElementRef) {
  }

  reset() {
    while (this.outputElem.firstChild) {
      this.outputElem.removeChild(this.outputElem.firstChild);
    }
  }

  ngOnInit() {
    this.prosper.addOutput(this);
  }

  input(value) {
    this.latestInput += this.SEP + value.label;
    this.SEP = ' ';
  }

  ngAfterContentInit() {
    this.outputElem = this.$element.nativeElement.querySelector('output');
    this.SEP = '';
    this.latestInput = '';
  }

  output(prediction) {
    const questionElem = document.createElement('div');
    questionElem.classList.add('question');
    questionElem.append(this.latestInput);
    this.outputElem.append(questionElem);

    let answer = '';
    this.SEP = '';
    prediction.forEach(p => {
      answer += this.SEP + p;
    });
    if (!answer) {
      answer = '...';
    }
    const answerElem = document.createElement('div');
    answerElem.classList.add('answer');
    answerElem.append(answer);
    this.outputElem.append(answerElem);

    this.outputElem.append(answerElem);
    this.latestInput = '';
    this.outputElem.querySelector('.answer:last-child').scrollIntoView();
  }
}
