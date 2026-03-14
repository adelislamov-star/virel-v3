'use client';

interface StickyFormFooterProps {
  currentStep: number;
  totalSteps: number;
  stepLabel: string;
  onBack?: () => void;
  onNext?: () => void;
  onCancel?: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isLastStep?: boolean;
  saving?: boolean;
}

export default function StickyFormFooter({
  currentStep,
  totalSteps,
  stepLabel,
  onBack,
  onNext,
  onCancel,
  onSaveDraft,
  onSubmit,
  isLastStep = false,
  saving = false,
}: StickyFormFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-700 bg-zinc-900/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <span className="text-sm text-zinc-400">
          Step {currentStep + 1} of {totalSteps} · {stepLabel}
        </span>
        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
          )}
          {onBack && currentStep > 0 && (
            <button
              type="button"
              onClick={onBack}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
          )}
          {isLastStep && onSaveDraft && (
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving}
              className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
          )}
          {isLastStep && onSubmit ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={saving}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          ) : onNext ? (
            <button
              type="button"
              onClick={onNext}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-500 transition-colors"
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
