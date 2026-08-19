import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import QRCode from 'qrcode';

/** Scannable entry QR — Pack/Activate surface only; Platform unchanged. */
@Component({
  standalone: true,
  selector: 'leos-entry-qr',
  imports: [CommonModule],
  template: `
    @if (dataUrl) {
      <img
        class="leos-entry-qr"
        [src]="dataUrl"
        [alt]="'QR code for ' + (label || 'entry')"
        [width]="size"
        [height]="size"
      />
    } @else if (error) {
      <p class="leos-muted">{{ error }}</p>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .leos-entry-qr {
        display: block;
        width: var(--leos-qr-size, 160px);
        height: var(--leos-qr-size, 160px);
        border-radius: 12px;
        background: #fff;
        box-shadow: 0 8px 24px rgba(15, 20, 25, 0.12);
      }
    `,
  ],
})
export class EntryQrComponent implements OnChanges {
  @Input({ required: true }) value = '';
  @Input() label = '';
  @Input() size = 160;
  dataUrl = '';
  error = '';

  ngOnChanges() {
    void this.render();
  }

  /** Download PNG — used by Studio Live achievement. */
  downloadPng(filename = 'leos-qr.png') {
    if (!this.dataUrl) return false;
    const a = document.createElement('a');
    a.href = this.dataUrl;
    a.download = filename;
    a.click();
    return true;
  }

  private async render() {
    this.error = '';
    this.dataUrl = '';
    if (!this.value) return;
    try {
      this.dataUrl = await QRCode.toDataURL(this.value, {
        width: this.size,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    } catch {
      this.error = 'Could not render QR';
    }
  }
}

