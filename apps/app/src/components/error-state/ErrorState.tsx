import { Button } from "../button/Button";

type ErrorStateProps = {
  /** What went wrong, for example "We couldn't load your order.". */
  message: string;
  /** Called by the secondary "Try again" button. Without it there is no button. */
  onRetry?: () => void;
};

/** A part of a screen whose request failed: an alert with the message and, when it can, Try again. */
export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4">
      <p className="type-text-regular-m text-text">{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
