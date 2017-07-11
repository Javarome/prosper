import {Component, ElementRef, Input} from "@angular/core";

import {Prosper} from "./Prosper.module.ts";

@Component({
  selector: 'prosper-input',
  templateUrl: '/src/ProsperInput.html'
})
export class ProsperInput {
  private value;
  private speed;
  private sampleCharsType;
  private sampleWordsType;
  private items;
  private sampleType;
  @Input() private prosper: Prosper;

  constructor(private $element: ElementRef) {
    this.value = '';
    this.speed = 0;
    this.sampleCharsType = {value: 'chars', label: 'Chars'};
    this.sampleWordsType = {value: 'words', label: 'Words'};
    this.items = [this.sampleCharsType, this.sampleWordsType];
    this.sampleType = this.sampleCharsType;
  }

  log(msg) {
    console.log(`ProsperInput: ${msg}`);
  }

  ngOnInit() {
    this.prosper.addInput(this);
  }

  sampleChars(value: string) {
    return value.split('');
  }

  sampleWords(value: string) {
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
  }

  reset() {
    this.prosper.reset();
  }

  refresh() {
    this.prosper.refresh();
  }

  submit() {
    const sample = this.sampleType === this.sampleCharsType ? this.sampleChars : this.sampleWords;
    const values = sample(this.value);
    // this.$rootScope.$emit("prosperInput", Date.now().toString());
    let i = 0;
    values.forEach(value => {
      setTimeout(() => this.prosper.input(value), this.speed * i++);
    });
    this.value = '';
    this.$element.nativeElement.querySelector('input').focus();
  }
}