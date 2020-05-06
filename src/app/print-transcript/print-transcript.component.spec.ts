import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PrintTranscriptComponent } from './print-transcript.component';

describe('PrintTranscriptComponent', () => {
  let component: PrintTranscriptComponent;
  let fixture: ComponentFixture<PrintTranscriptComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PrintTranscriptComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PrintTranscriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
