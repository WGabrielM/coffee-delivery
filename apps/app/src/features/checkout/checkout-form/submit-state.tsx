import { createContext, useContext } from "react";

export type SubmitState = {
  /** True while the order request runs. */
  isSubmitting: boolean;
  /** The message above the Confirm order button after a failure no field can show. */
  alertMessage: string | undefined;
};

const NOT_SUBMITTING: SubmitState = { isSubmitting: false, alertMessage: undefined };

/** The default is "not submitting", so the summary also renders outside a checkout form. */
export const SubmitStateContext = createContext<SubmitState>(NOT_SUBMITTING);

export function useSubmitState(): SubmitState {
  return useContext(SubmitStateContext);
}
