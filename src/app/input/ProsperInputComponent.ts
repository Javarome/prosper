import {Component, ElementRef, Input, OnInit} from '@angular/core';
import {Iterator} from "../../util/Iterator";
import {SampleType} from "./SampleType";
import {SampleChoice} from "./SampleChoice";
import {Prosper} from "../../api/Prosper";
import {IterationType} from "../../api/IterationType";
import {IterationChoice} from "../../api/IterationChoice";
import {CharNodeFactory} from "../../api/CharNodeFactory";
import {AutoIterator} from "../../api/AutoIterator";
import {ManualIterator} from "../../api/ManualIterator";
import {WordNodeFactory} from "../../api/WordNodeFactory";


@Component({
  selector: 'prosper-input',
  templateUrl: 'ProsperInputComponent.html',
  styleUrls: ['ProsperInputComponent.scss']
})
export class ProsperInputComponent implements OnInit {
  @Input() prosper: Prosper;

  iteration: Iterator<string>;
  memoryFile;

  value;

  speed: number;
  sampleTypes: SampleChoice[];
  sampleType: SampleChoice;
  empty = true;
  autoIteration: IterationChoice<string>;
  iterationTypes;
  iterationType: IterationChoice<string>;
  manualIteration: IterationChoice<string>;

  private readonly sampleCharsType: SampleChoice;
  private readonly sampleWordsType: SampleChoice;

  constructor(private $element: ElementRef) {
    this.value = '';
    this.speed = 0;
    this.sampleCharsType = {
      value: SampleType.chars,
      label: 'Chars',
      sample: (input, nodeFactory) => input.split('').map(sample => nodeFactory.create(sample)),
      nodeFactory: new CharNodeFactory()
    };
    this.sampleWordsType = {
      value: SampleType.words,
      label: 'Words',
      sample: (input, nodeFactory) => input.split(' ').map(sample => nodeFactory.create(sample)),
      nodeFactory: new WordNodeFactory()
    };
    this.sampleTypes = [this.sampleCharsType, this.sampleWordsType];
    this.sampleType = this.sampleCharsType;

    this.autoIteration = {
      value: IterationType.automatic,
      label: 'Automatic',
      create(prosper: Prosper, nodeFactory): AutoIterator<string> {
        return new AutoIterator<string>(prosper, nodeFactory);
      }
    };
    this.manualIteration = {
      value: IterationType.manual,
      label: 'Manual',
      create(prosper: Prosper, nodeFactory): ManualIterator<string> {
        return new ManualIterator<string>(prosper, nodeFactory);
      }
    };
    this.iterationTypes = [this.autoIteration, this.manualIteration];
    this.iterationType = this.autoIteration;
  }

  log(msg): void {
    console.log(`ProsperInput: ${msg}`);
  }

  ngOnInit(): void {
    this.prosper.addInput(this);
  }

  reset(): void {
    this.prosper.reset();
    this.empty = true;
  }

  refresh(): void {
    this.prosper.refresh();
  }

  save(): void {
    const state = this.prosper.getState();
    const jsonState = JSON.stringify(state);
    const stateBlob = new Blob([jsonState], {type: 'application/json'});
    const filename = 'prosper-memory.json';
    if (window.navigator.msSaveOrOpenBlob) {
      window.navigator.msSaveBlob(stateBlob, filename);
    } else {
      const elem = window.document.createElement('a');
      elem.href = window.URL.createObjectURL(stateBlob);
      elem.download = filename;
      document.body.appendChild(elem);
      elem.click();
      document.body.removeChild(elem);
    }
  }

  replay(): void {
    const state: any = this.prosper.getState();
    const inputs = state.nodes.map(node => node.concept ? null : this.sampleType.nodeFactory.create(node.id));
    this.prosper.reset();
    this.iterate(inputs);
  }

  upload(): void {
    const inputEl: any = document.getElementById('memoryFile');
    const file = inputEl.files[0];
    const memoryFileReader = new FileReader();
    memoryFileReader.onloadend = (e: ProgressEvent<any>) => {
      const memoryData = JSON.parse(e.target.result);
      this.empty = memoryData.nodes.length <= 0;
      this.prosper.setState(memoryData);
    };
    memoryFileReader.readAsText(file);
  }

  submit(): void {
    const sampling = this.sampleType.sample(this.value, this.sampleType.nodeFactory);
    // this.prosper.input(Date.now().toString());
    this.iterate(sampling);
    this.empty = false;
    this.value = '';
    this.$element.nativeElement.querySelector('input').focus();
  }

  iterate(sampling): void {
    this.iteration = this.iterationType.create(this.prosper, this.sampleType.nodeFactory);
    this.iteration.iterate(sampling, this);
  }
}
