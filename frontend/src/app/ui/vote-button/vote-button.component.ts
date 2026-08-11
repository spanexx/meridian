import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

export type UiVote = 'approve' | 'reject' | null;

@Component({
  selector: 'ui-vote-button',
  standalone: true,
  template: `
    <button
      class="vote-btn"
      [class.active]="vote !== null"
      [class.approve]="vote === 'approve'"
      [class.reject]="vote === 'reject'"
      type="button"
      (click)="onClick()"
      [attr.aria-pressed]="vote !== null"
      [attr.aria-label]="ariaLabel || 'Vote'"
    >
      <ng-content />
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiVoteButtonComponent {
  @Input() vote: UiVote = null;
  @Input() ariaLabel: string | null = null;
  @Output() voteChange = new EventEmitter<UiVote>();

  onClick(): void {
    const next: UiVote = this.vote === 'approve' ? null : 'approve';
    this.vote = next;
    this.voteChange.emit(next);
  }
}