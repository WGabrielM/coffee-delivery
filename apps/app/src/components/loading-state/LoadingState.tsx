type LoadingStateProps = {
  /** What is loading, for example "Loading your order…". */
  text: string;
};

/**
 * A spinner and a text in an `output`, for a part of a screen that waits for the API. The spinner is
 * decoration (hidden from assistive technology) and stops under `prefers-reduced-motion`.
 */
export function LoadingState({ text }: LoadingStateProps) {
  return (
    <output className="flex items-center gap-3 type-text-regular-m text-text">
      <span
        data-spinner
        aria-hidden="true"
        className="size-6 animate-spin rounded-round border-2 border-button border-t-purple motion-reduce:animate-none"
      />
      {text}
    </output>
  );
}
