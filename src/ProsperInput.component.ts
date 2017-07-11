import {Component, ElementRef, Input} from "@angular/core";

import {Prosper} from "./Prosper.component.ts";

@Component({
  selector: 'prosper-input',
  templateUrl: '/src/ProsperInput.component.html'
})
export class ProsperInput {
  private value;
  private speed: number;
  private sampleCharsType;
  private sampleWordsType;
  private items;
  private sampleType;

  @Input()
  private prosper: Prosper;

  constructor(private $element: ElementRef) {
    this.value = '';
    this.speed = 0;
    this.sampleCharsType = {value: 'chars', label: 'Chars', sample: this.sampleChars};
    this.sampleWordsType = {value: 'words', label: 'Words', sample: this.sampleWords};
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
    const values = this.sampleType.sample(this.value);
    // this.prosper.input(Date.now().toString());
    let i = 0;
    values.forEach(value => {
      setTimeout(() => this.prosper.input(value), this.speed * i++);
    });
    this.value = '';
    this.$element.nativeElement.querySelector('input').focus();
  }
}