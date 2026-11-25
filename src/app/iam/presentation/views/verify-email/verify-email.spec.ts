import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmailVerificationService } from '../../../application/email-verification.service';
import { VerifyEmail } from './verify-email';

describe('VerifyEmail forms', () => {
  const token = 'a'.repeat(43);
  const verify = vi.fn(() => of(undefined));
  const resend = vi.fn(() => of(undefined));
  beforeEach(async () => {
    verify.mockClear(); resend.mockClear();
    await TestBed.configureTestingModule({
      imports: [VerifyEmail],
      providers: [provideRouter([]), provideTranslateService(),
        { provide: ActivatedRoute, useValue: { snapshot: { fragment: `token=${token}` } } },
        { provide: EmailVerificationService, useValue: { verify, resend } },
      ],
    }).compileComponents();
  });
  function submit(inputId: string, value: string) {
    const fixture = TestBed.createComponent(VerifyEmail);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>(inputId)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    const event = new Event('submit', { bubbles: true, cancelable: true });
    input.closest('form')!.dispatchEvent(event);
    fixture.detectChanges();
    expect(event.defaultPrevented).toBe(true);
  }
  it('submits the verification without native navigation', () => {
    submit('#verification-password', 'TestPassword!');
    expect(verify).toHaveBeenCalledOnce();
    expect(verify).toHaveBeenCalledWith({ token, password: 'TestPassword!' });
    expect(resend).not.toHaveBeenCalled();
  });
  it('submits the resend without native navigation', () => {
    submit('#verification-email', 'test@example.com');
    expect(resend).toHaveBeenCalledExactlyOnceWith('test@example.com');
    expect(verify).not.toHaveBeenCalled();
  });
});
