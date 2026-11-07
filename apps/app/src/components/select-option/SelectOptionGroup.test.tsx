import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { accessibilityViolations } from "../../test/axe";
import { SelectOptionGroup, type SelectOptionItem } from "./SelectOptionGroup";

type Payment = "CREDIT_CARD" | "DEBIT_CARD" | "CASH";

const options: SelectOptionItem<Payment>[] = [
  { value: "CREDIT_CARD", label: "Credit card", icon: "credit-card" },
  { value: "DEBIT_CARD", label: "Debit card", icon: "bank" },
  { value: "CASH", label: "Cash", icon: "money" },
];

/** A parent that owns the value, like the checkout form will. */
function Controlled({
  initial,
  onChange,
  name,
}: {
  initial?: Payment;
  onChange?: (value: Payment) => void;
  name?: string;
}) {
  const [value, setValue] = useState<Payment | undefined>(initial);
  return (
    <SelectOptionGroup
      label="Payment method"
      options={options}
      value={value}
      {...(name === undefined ? {} : { name })}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const optionOf = (name: string) => screen.getByRole("radio", { name }).closest("label");

describe("SelectOptionGroup", () => {
  it("is a radio group with an accessible name and one radio per option", () => {
    render(<Controlled />);

    expect(screen.getByRole("radiogroup", { name: "Payment method" })).toBeInTheDocument();
    expect(
      screen.getAllByRole("radio").map((radio) => radio.closest("label")?.textContent),
    ).toEqual(["Credit card", "Debit card", "Cash"]);
  });

  it("names each radio by its label text", () => {
    render(<Controlled />);

    expect(screen.getByRole("radio", { name: "Credit card" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Debit card" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Cash" })).toBeInTheDocument();
  });

  it("starts with nothing selected when no value is given", () => {
    render(<Controlled />);

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("aria-checked", "false");
      expect(radio).not.toBeChecked();
    }
  });

  it("marks the selected option with aria-checked", () => {
    render(<Controlled initial="DEBIT_CARD" />);

    expect(screen.getByRole("radio", { name: "Debit card" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "Debit card" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Cash" })).toHaveAttribute("aria-checked", "false");
  });

  it("selects an option on click and calls onChange with its value", async () => {
    const onChange = vi.fn<(value: Payment) => void>();
    render(<Controlled onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Cash" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("CASH");
    expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Cash" })).toHaveAttribute("aria-checked", "true");
  });

  it("selects when the visible label is clicked, not only the hidden radio", async () => {
    render(<Controlled />);

    await userEvent.click(screen.getByText("Debit card"));

    expect(screen.getByRole("radio", { name: "Debit card" })).toBeChecked();
  });

  it("selects at most one option: choosing another one unselects the first", async () => {
    render(<Controlled initial="CREDIT_CARD" />);

    await userEvent.click(screen.getByRole("radio", { name: "Cash" }));

    expect(
      screen.getAllByRole("radio").filter((radio) => radio.getAttribute("aria-checked") === "true"),
    ).toHaveLength(1);
    expect(screen.getByRole("radio", { name: "Credit card" })).not.toBeChecked();
  });

  it("does not call onChange when the selected option is clicked again", async () => {
    const onChange = vi.fn<(value: Payment) => void>();
    render(<Controlled initial="CASH" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: "Cash" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
  });

  it("is controlled: the selection follows the value prop", () => {
    const { rerender } = render(
      <SelectOptionGroup
        label="Payment method"
        options={options}
        value="CASH"
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();

    rerender(
      <SelectOptionGroup
        label="Payment method"
        options={options}
        value="CREDIT_CARD"
        onChange={() => {}}
      />,
    );

    expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Cash" })).not.toBeChecked();
  });

  describe("form field", () => {
    it("gives the options one shared name, so the browser treats them as one group", () => {
      render(<Controlled />);

      const names = screen.getAllByRole("radio").map((radio) => radio.getAttribute("name"));

      expect(new Set(names).size).toBe(1);
      expect(names[0]).toBeTruthy();
    });

    it("uses the name it is given and the value of each option, for a form to submit", () => {
      render(<Controlled name="paymentMethod" initial="CASH" />);

      for (const radio of screen.getAllByRole("radio")) {
        expect(radio).toHaveAttribute("name", "paymentMethod");
      }
      expect(screen.getByRole("radio", { name: "Cash" })).toHaveAttribute("value", "CASH");
      expect(screen.getByRole("radio", { name: "Credit card" })).toHaveAttribute(
        "value",
        "CREDIT_CARD",
      );
    });

    it("keeps two groups on one page independent", async () => {
      render(
        <>
          <Controlled />
          <Controlled initial="CASH" />
        </>,
      );

      const [first] = screen.getAllByRole("radio", { name: "Credit card" });
      await userEvent.click(first!);

      expect(screen.getAllByRole("radio", { checked: true })).toHaveLength(2);
      expect(screen.getAllByRole("radio", { name: "Cash" })[1]).toBeChecked();
    });
  });

  describe("keyboard", () => {
    it("is one stop in the tab order: the selected option", async () => {
      render(
        <>
          <button type="button">Before</button>
          <Controlled initial="DEBIT_CARD" />
          <button type="button">After</button>
        </>,
      );

      await userEvent.tab();
      await userEvent.tab();

      expect(screen.getByRole("radio", { name: "Debit card" })).toHaveFocus();

      await userEvent.tab();

      expect(screen.getByRole("button", { name: "After" })).toHaveFocus();
    });

    it("is entered on the first option when none is selected", async () => {
      render(<Controlled />);

      await userEvent.tab();

      expect(screen.getByRole("radio", { name: "Credit card" })).toHaveFocus();
    });

    it("moves the selection and the focus with the arrow keys", async () => {
      const onChange = vi.fn<(value: Payment) => void>();
      render(<Controlled initial="CREDIT_CARD" onChange={onChange} />);
      await userEvent.tab();

      await userEvent.keyboard("{ArrowRight}");

      expect(screen.getByRole("radio", { name: "Debit card" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Debit card" })).toHaveFocus();

      await userEvent.keyboard("{ArrowDown}");

      expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Cash" })).toHaveFocus();

      await userEvent.keyboard("{ArrowLeft}");
      await userEvent.keyboard("{ArrowUp}");

      expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();
      expect(onChange.mock.calls.map(([value]) => value)).toEqual([
        "DEBIT_CARD",
        "CASH",
        "DEBIT_CARD",
        "CREDIT_CARD",
      ]);
    });

    it("wraps around at both ends", async () => {
      render(<Controlled initial="CASH" />);
      await userEvent.tab();

      await userEvent.keyboard("{ArrowRight}");

      expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();

      await userEvent.keyboard("{ArrowLeft}");

      expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
    });

    it("jumps to the first option with Home and to the last with End", async () => {
      const onChange = vi.fn<(value: Payment) => void>();
      render(<Controlled initial="DEBIT_CARD" onChange={onChange} />);
      await userEvent.tab();

      await userEvent.keyboard("{End}");

      expect(screen.getByRole("radio", { name: "Cash" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Cash" })).toHaveFocus();

      await userEvent.keyboard("{Home}");

      expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Credit card" })).toHaveFocus();
      expect(onChange.mock.calls.map(([value]) => value)).toEqual(["CASH", "CREDIT_CARD"]);
    });

    it("does not call onChange when Home or End lands on the option already selected", async () => {
      const onChange = vi.fn<(value: Payment) => void>();
      render(<Controlled initial="CASH" onChange={onChange} />);
      await userEvent.tab();

      await userEvent.keyboard("{End}");

      expect(onChange).not.toHaveBeenCalled();
      expect(screen.getByRole("radio", { name: "Cash" })).toHaveFocus();
    });

    it("selects the focused option with Space", async () => {
      render(<Controlled />);
      await userEvent.tab();

      await userEvent.keyboard(" ");

      expect(screen.getByRole("radio", { name: "Credit card" })).toBeChecked();
    });

    it("ignores other keys", async () => {
      const onChange = vi.fn<(value: Payment) => void>();
      render(<Controlled initial="CREDIT_CARD" onChange={onChange} />);
      await userEvent.tab();

      await userEvent.keyboard("a");

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("look", () => {
    it("shows the selected option with the purple-light fill and the purple border", () => {
      render(<Controlled initial="CASH" />);

      expect(optionOf("Cash")).toHaveClass("bg-purple-light", "border-purple");
    });

    it("shows an unselected option with the button fill and a hover fill", () => {
      render(<Controlled initial="CASH" />);

      expect(optionOf("Credit card")).toHaveClass("bg-button", "border-button", "hover:bg-hover");
      expect(optionOf("Credit card")).not.toHaveClass("border-purple");
    });

    it("is 51 px high with a 6 px radius, an uppercase label, and a purple icon", () => {
      render(<Controlled />);

      const option = optionOf("Credit card");

      expect(option).toHaveClass("h-12.75", "rounded-button", "type-button-s", "text-text");
      expect(option?.querySelector("[aria-hidden='true']")).toHaveClass("text-purple");
    });

    it("keeps the text case and uppercases it through styling", () => {
      render(<Controlled />);

      expect(optionOf("Credit card")?.textContent).toBe("Credit card");
    });

    it("draws the keyboard-only focus ring around the option, not on mouse focus", () => {
      render(<Controlled />);

      expect(optionOf("Cash")).toHaveClass(
        "has-focus-visible:outline-2",
        "has-focus-visible:outline-purple",
      );
      expect(optionOf("Cash")?.className).not.toMatch(/(^|\s)(has-focus|focus):outline/);
    });

    it("hides the radio visually but keeps it for assistive technology", () => {
      render(<Controlled />);

      expect(screen.getByRole("radio", { name: "Cash" })).toHaveClass("sr-only");
    });
  });

  it("passes an axe check with and without a selection", async () => {
    const { container } = render(
      <>
        <Controlled />
        <Controlled initial="CASH" />
      </>,
    );

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});

function Invalid() {
  return (
    <SelectOptionGroup
      label="Payment method"
      options={options}
      value={undefined}
      onChange={() => {}}
      error="Choose a payment method"
    />
  );
}

describe("SelectOptionGroup with an error", () => {
  it("shows the message below the options in the error color", () => {
    render(<Invalid />);

    const message = screen.getByText("Choose a payment method");

    expect(message).toHaveClass("type-text-regular-s", "text-error");
    expect(
      screen.getByRole("radiogroup", { name: "Payment method" }).compareDocumentPosition(message) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("marks the group invalid and links it to the message", () => {
    render(<Invalid />);

    const group = screen.getByRole("radiogroup", { name: "Payment method" });
    const message = screen.getByText("Choose a payment method");

    expect(group).toHaveAttribute("aria-invalid", "true");
    expect(group).toHaveAttribute("aria-describedby", message.id);
    expect(group).toHaveAccessibleDescription("Choose a payment method");
  });

  it("is not invalid and has no description without an error", () => {
    render(<Controlled />);

    const group = screen.getByRole("radiogroup", { name: "Payment method" });

    expect(group).not.toHaveAttribute("aria-invalid");
    expect(group).not.toHaveAttribute("aria-describedby");
  });

  it("has no accessibility violation with the error", async () => {
    const { container } = render(<Invalid />);

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
