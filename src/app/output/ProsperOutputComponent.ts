import {AfterContentInit, Component, ElementRef, Input, OnInit} from '@angular/core';
import {ProsperComponent} from "../ProsperComponent";


@Component({
  selector: 'prosper-output',
  template: '<output></output>',
  styleUrls: ['ProsperOutputComponent.scss']
})
export class ProsperOutputComponent implements OnInit, AfterContentInit {
  @Input() private prosper: ProsperComponent;

  private SEP;
  private latestInput;
  private outputElem;

  constructor(private $element: ElementRef) {
  }

  reset(): void {
    while (this.outputElem.firstChild) {
      this.outputElem.removeChild(this.outputElem.firstChild);
    }
  }

  ngOnInit(): void {
    this.prosper.addOutput(this);
  }

  input(value): void {
    this.latestInput += this.SEP + value.label;
    this.SEP = ' ';
  }

  ngAfterContentInit(): void {
    this.outputElem = this.$element.nativeElement.querySelector('output');
    this.SEP = '';
    this.latestInput = '';
  }

  output(prediction): void {
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
