import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-rent-confirmation-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rent-confirmation-modal.component.html',
  styleUrls: ['./rent-confirmation-modal.component.scss']
})
export class RentConfirmationModalComponent {
  @Input() property: any;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
