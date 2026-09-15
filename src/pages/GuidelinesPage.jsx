import React from "react";
import "./GuidelinesPage.css";

const lifecycle = [
  {
    number: "01",
    title: "Set up master data",
    description:
      "Before creating business documents, configure the reusable data used throughout the application.",
    items: [
      "Create users and assign their roles.",
      "Create modules and maintain their base prices.",
      "Add customers, suppliers, company details, bank accounts, GST rates, and terms templates.",
    ],
    action: "Settings",
  },
  {
    number: "02",
    title: "Create a quotation",
    description:
      "Start a quotation for a customer, select the required modules, and review the calculated prices and taxes.",
    items: [
      "Enter customer, contact, address, validity, and quotation details.",
      "Add modules and any implementation or additional charges.",
      "Save the quotation, then preview, edit, revise, download, or email it as required.",
    ],
    action: "Create quotation",
  },
  {
    number: "03",
    title: "Manage quotation revisions",
    description:
      "Use revision history when a quotation changes after it has been created.",
    items: [
      "Open the quotation from Quotations.",
      "Create a revision instead of overwriting the original version.",
      "Use All Revisions or Quotation History to compare and track changes.",
    ],
    action: "Quotations",
  },
  {
    number: "04",
    title: "Create a purchase order",
    description:
      "Once the customer confirms the quotation, create a purchase order for the agreed scope.",
    items: [
      "Open the relevant quotation and convert or create the purchase order.",
      "Verify supplier, customer, line items, taxes, totals, and terms.",
      "Save the purchase order and use the print preview when it is ready to share.",
    ],
    action: "Purchase Orders",
  },
  {
    number: "05",
    title: "Create and issue the invoice",
    description:
      "Generate the GST invoice from the quotation or purchase order and record its payment status.",
    items: [
      "Enter or load the customer, billing, tax, and line-item information.",
      "Save the invoice before changing its status.",
      "Use the invoice status actions in order: advance received, partially paid, overdue, and paid.",
    ],
    action: "GST Invoice",
  },
  {
    number: "06",
    title: "Create a subscription",
    description:
      "For recurring module services, create a customer subscription with its commercial terms.",
    items: [
      "Select the customer and module.",
      "Enter the purchase date, subscription period, current year, and initial price.",
      "Set the renewal percentage and annual escalation percentage.",
      "The system uses these values to calculate future renewal amounts.",
    ],
    action: "Customer subscriptions",
  },
  {
    number: "07",
    title: "Prepare the renewal",
    description:
      "When a renewal is due, prepare one renewal record for the next subscription year.",
    items: [
      "Open Renewals and generate or prepare the renewal quotation.",
      "The system reuses an open renewal instead of creating duplicates.",
      "The renewal amount is calculated from the original amount, renewal percentage, escalation percentage, and renewal year.",
    ],
    action: "Renewals",
  },
  {
    number: "08",
    title: "Create the renewal quotation",
    description:
      "The renewal uses the standard quotation form, but the calculated renewal amount is passed as a price override.",
    items: [
      "Review the prefilled customer, module, period, and renewal amount.",
      "Save the quotation.",
      "The quotation is linked to the renewal and the renewal status becomes quoted.",
    ],
    action: "Renewal quotations",
  },
  {
    number: "09",
    title: "Create the renewal invoice",
    description:
      "Create the invoice from the linked renewal quotation so the renewal can be tracked to payment.",
    items: [
      "Open the invoice action for the renewal.",
      "Verify the linked quotation and invoice details.",
      "Save the invoice; the renewal status becomes invoiced.",
    ],
    action: "Invoice",
  },
  {
    number: "10",
    title: "Complete the renewal through payment",
    description:
      "Payment is the only event that advances the subscription to the next period.",
    items: [
      "Mark the linked invoice as paid after payment is received.",
      "The renewal becomes paid.",
      "The subscription current year, end date, and next renewal date are advanced automatically.",
      "Creating a quotation or invoice alone does not renew the subscription.",
    ],
    action: "Mark invoice as paid",
  },
];

const statusRows = [
  ["Subscription", "pending", "active", "expired / cancelled"],
  ["Renewal", "pending", "quoted", "invoiced → paid"],
  ["Invoice", "draft", "advance_received / partially_paid", "paid / overdue"],
];

export default function GuidelinesPage() {
  return (
    <div className="guidelines-page">
      <section className="guidelines-hero">
        <div>
          <p className="guidelines-eyebrow">Quotation Management Guide</p>
          <h1>How the application works</h1>
          <p>
            Follow this guide from initial setup through quotation, invoicing,
            subscriptions, renewals, and payment completion.
          </p>
        </div>
        <div className="guidelines-hero__badge">10-step business flow</div>
      </section>

      <section className="guidelines-flow" aria-label="Business flow summary">
        {[
          "Setup",
          "Quotation",
          "Purchase order",
          "Invoice",
          "Payment",
          "Renewal",
        ].map((step, index) => (
          <React.Fragment key={step}>
            <span className="guidelines-flow__step">
              <strong>{String(index + 1).padStart(2, "0")}</strong>
              {step}
            </span>
            {index < 5 && <span className="guidelines-flow__arrow">→</span>}
          </React.Fragment>
        ))}
      </section>

      <section className="guidelines-section">
        <div className="guidelines-section__heading">
          <p className="guidelines-eyebrow">Step-by-step process</p>
          <h2>Complete module lifecycle</h2>
          <p>
            Complete each stage in order. The linked quotation and invoice
            records provide the traceability needed for renewals.
          </p>
        </div>
        <div className="guidelines-steps">
          {lifecycle.map((step) => (
            <article className="guidelines-step" key={step.number}>
              <div className="guidelines-step__number">{step.number}</div>
              <div className="guidelines-step__content">
                <div className="guidelines-step__title-row">
                  <h3>{step.title}</h3>
                  <span>{step.action}</span>
                </div>
                <p>{step.description}</p>
                <ul>
                  {step.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="guidelines-section guidelines-section--compact">
        <div className="guidelines-section__heading">
          <p className="guidelines-eyebrow">Status reference</p>
          <h2>What each status means</h2>
        </div>
        <div className="guidelines-status-table">
          <div className="guidelines-status-table__row guidelines-status-table__row--header">
            <span>Record</span>
            <span>Starting status</span>
            <span>In progress</span>
            <span>Completed or closed</span>
          </div>
          {statusRows.map((row) => (
            <div className="guidelines-status-table__row" key={row[0]}>
              {row.map((cell, index) => (
                <span key={`${row[0]}-${index}`}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="guidelines-notes">
        <h2>Important rules</h2>
        <div className="guidelines-notes__grid">
          <p>
            <strong>Payment completes a renewal.</strong> A quotation or invoice
            does not extend the subscription by itself.
          </p>
          <p>
            <strong>One renewal per subscription year.</strong> Preparing an
            existing open renewal reuses it instead of creating a duplicate.
          </p>
          <p>
            <strong>Expiry is automatic on data load.</strong> Active
            subscriptions whose end date has passed are shown as expired when
            subscription or renewal data is loaded.
          </p>
          <p>
            <strong>Keep linked records together.</strong> Renewal, quotation,
            invoice, and payment should refer to the same customer and module.
          </p>
        </div>
      </section>
    </div>
  );
}
