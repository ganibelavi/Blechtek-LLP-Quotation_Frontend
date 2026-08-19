import React, { useEffect, useState } from "react";
import { fetchModules, resolveDownloadUrl } from "../services/quotationApi";
import "./QuotationPdfView.css";
import "../components/QuotationPreview.css";

const initialValues = {
  organizationName: "",
  validationDate: "",
  selectedModules: [],
  quotationTo: { name: "", address: "", contactNo: "", email: "" },
  quotationNo: "",
  date: "",
};

export default function QuotationPdfView({ onBack }) {
  const handleBack = () => onBack("settings");
  const [values, setValues] = useState(initialValues);
  const [result, setResult] = useState(null);
  const [allModules, setAllModules] = useState([]);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("quotationData");
    const storedValues = sessionStorage.getItem("quotationFormValues");
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult));
      } catch (e) {
        console.error("Failed to parse quotation data", e);
      }
    }
    if (storedValues) {
      try {
        setValues(JSON.parse(storedValues));
      } catch (e) {
        console.error("Failed to parse form values", e);
      }
    }
    // Fetch modules to get pillar/module mapping for scope table
    fetchModules()
      .then(setAllModules)
      .catch(() => console.error("Failed to load modules"));
  }, []);

  const handleNewQuotation = () => {
    sessionStorage.removeItem("quotationData");
    sessionStorage.removeItem("quotationFormValues");
    onBack();
  };

  function formatValidationDate(iso) {
    if (!iso) return "{{VALIDATION_DATE}}";
    return new Date(iso)
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, " ");
  }

  const {
    organizationName,
    validationDate,
    selectedModules,
    quotationTo,
    quotationNo,
    date,
  } = values;

  // Format date for display, handling min date value
  const formatDisplayDate = (dateStr) => {
    if (!dateStr || dateStr.startsWith("0001-01-01")) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const displayQuotationNo = quotationNo || "{{QUOTATION_NO}}";
  const displayDate = formatDisplayDate(date) || "{{DATE}}";

  const moduleList =
    selectedModules.length === 1
      ? selectedModules[0]
      : selectedModules.slice(0, -1).join(", ") +
        (selectedModules.length > 1
          ? " & " + selectedModules[selectedModules.length - 1]
          : "");

  // Get selected modules with their pillar info from the master module list
  const scopeModules = allModules.filter((m) =>
    selectedModules.includes(m.module),
  );

  // Get price from the first selected module (or sum if multiple)
  const modulePrice = scopeModules.length > 0
    ? scopeModules.reduce((sum, m) => sum + (m.price || 0), 0)
    : null;

  if (
    !result &&
    !organizationName &&
    !quotationTo.name &&
    selectedModules.length === 0
  ) {
    return (
      <div className="quotation-pdf-view">
        <div className="pdf-view__header">
          <h2>Quotation Preview</h2>
        </div>
        <div className="pdf-view__content">
          <aside className="q-preview">
            <div className="q-preview__empty">
              <p>
                Complete the form and click "Generate quotation" to see the full
                quotation preview.
              </p>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="quotation-pdf-view">
      <div className="pdf-view__header">
        <h2>Quotation Preview</h2>
        <div className="pdf-view__actions"></div>
        <button
          className="pdf-view__back-btn"
          onClick={handleBack}
          aria-label="Back to quotations list"
        >
          <svg
            className="pdf-view__back-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span className="pdf-view__back-text"></span>
        </button>
      </div>

      <div className="pdf-view__content">
        <div className="pdf-document">
          <div className="pdf-header">
            <div className="pdf-header__left">
              <img
                src="/logo/logo.png"
                alt="BlechTek Software Solutions LLP"
                className="pdf-header__logo"
              />
            </div>
            <div className="pdf-header__right">QUOTATION</div>
          </div>

          <div className="pdf-section pdf-section--quotation-to">
            <h3>QUOTATION TO</h3>
            <div className="quotation-to-grid">
              <div className="quotation-to-left">
                <p>Name: {quotationTo.name || "{{CONTACT_NAME}}"}</p>
                <p>Address: {quotationTo.address || "{{CONTACT_ADDRESS}"}</p>
                <p>
                  Contact No.: {quotationTo.contactNo || "{{CONTACT_PHONE}"} |
                  Email: {quotationTo.email || "{{CONTACT_EMAIL}"}
                </p>
              </div>
              <div className="quotation-to-right">
                <p>Quotation No.: {displayQuotationNo}</p>
                <p>Date: {displayDate}</p>
              </div>
            </div>
          </div>

          <div className="pdf-section">
            <p>
              <strong>Reference:</strong> Our discussions on implementation of{" "}
              {moduleList || "{{MODULE_LIST}"} in your organization.
            </p>
            <p>
              <strong>Subject:</strong> Business proposal for IT & Operations
              changeover consultancy and implementation of{" "}
              {moduleList || "{{MODULE_LIST}"}.
            </p>
          </div>

          <div className="pdf-section">
            <p>Dear Sir / Madam,</p>
          </div>

          <div className="pdf-section">
            <p>
              This is in reference to our discussions during our visit to your
              office. We thank you and your team for your valuable time during
              the presentation of CQUAL.
            </p>
            <p>
              Based on the challenges and solutions discussed, please find below
              a preliminary business proposal for the required changeover at{" "}
              {organizationName || "{{ORG_NAME}"}.
            </p>
          </div>

          <div className="pdf-section pdf-section--heading">
            <h3>Goals and Expectations</h3>
          </div>

          <div className="pdf-section">
            <p>
              Our experts will be involved in redefining the operations setup
              for sustainable growth and required digitalization at{" "}
              {organizationName || "{{ORG_NAME}"}.
            </p>
            <p>
              Digitization of {moduleList || "{{MODULE_LIST}"} replaces manual
              documentation, accelerates the approval process through
              centralized data management, and improves traceability while
              reducing administrative overhead.
            </p>
          </div>

          <div className="pdf-section pdf-section--heading">
            <h3>Scope of Work</h3>
          </div>

          <div className="pdf-section pdf-section--bullets">
            <ul>
              <li>Confirmation of your requirement specifications</li>
              <li>Requirement analysis</li>
              <li>Delivery of the required solution</li>
              <li>
                Training and implementation using CQUAL{" "}
                {moduleList || "{{MODULE_LIST}"}
              </li>
            </ul>
          </div>

          <div className="pdf-section pdf-section--note">
            <p>
              Deliverables do not include the source code. Use of the solution
              is under license from BlechTek Software Solutions LLP.
            </p>
          </div>

          <div className="pdf-section pdf-section--heading">
            <h3>Scope</h3>
          </div>

          <div className="pdf-section pdf-section--table">
            <table className="pdf-table">
              <thead>
                <tr>
                  <th>Pillar</th>
                  <th>Module</th>
                  <th>Selected</th>
                </tr>
              </thead>
              <tbody>
                {scopeModules.length > 0 ? (
                  scopeModules.map((m, i) => (
                    <tr
                      key={i}
                      className={i % 2 === 1 ? "pdf-table__row--alt" : ""}
                    >
                      <td>{m.pillar}</td>
                      <td>{m.module}</td>
                      <td>Yes</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="pdf-table__empty">
                      No modules selected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pdf-section pdf-section--heading">
            <h3>Price for Implementation</h3>
          </div>

          <div className="pdf-section pdf-section--table">
            <table className="pdf-table pdf-table--pricing">
              <thead>
                <tr>
                  <th style={{ width: "8%" }}>Sr. No.</th>
                  <th style={{ width: "72%" }}>Particulars</th>
                  <th style={{ width: "20%" }}>Price in INR</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>
                    <strong>
                      {moduleList || "CQUAL Module Name"} - Product License
                    </strong>{" "}
                    applicable for single installation.
                    <br />
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      Scope – As mentioned above
                    </span>
                  </td>
                  <td>{modulePrice !== null && modulePrice > 0 ? `₹${modulePrice.toLocaleString()}` : "TBD"}</td>
                </tr>
                <tr className="pdf-table__row--alt">
                  <td>2</td>
                  <td>
                    <strong>Customization</strong>
                    <br />
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      In case of any additional development required which will
                      be consider 7000 per man day additional to above proposal.
                    </span>
                  </td>
                  <td>TBD</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>
                    <strong>Annual License Renewal</strong>
                    <br />
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      The License renewal would be required to be done every
                      Year. These renewal fees will facilitate to have the
                      Product Upgrades, which would cover improvements, bug
                      fixes, and changes in statutory compliances. Included 7
                      Man days only and above will be chargeable.
                    </span>
                  </td>
                  <td>TBD</td>
                </tr>
                <tr className="pdf-table__row--alt">
                  <td>4</td>
                  <td>
                    <strong>Support Services</strong>
                    <br />
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      These Services start after 1 Month from start of Go Live.
                    </span>
                  </td>
                  <td>TBD</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>
                    <strong>Payment Terms</strong>
                    <br />
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      70% in Advance along with Purchase Order
                      <br />
                      20% on Implementation
                      <br />
                      10% GO LIVE
                    </span>
                  </td>
                  <td>On Chargeable</td>
                </tr>
                <tr className="pdf-table__row--alt">
                  <td>6</td>
                  <td>
                    <strong>Support Level</strong>
                  </td>
                  <td></td>
                </tr>
                <tr>
                  <td></td>
                  <td style={{ paddingLeft: "24px" }}>
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      <strong>L1: Telephone Support -</strong> Queries, To
                      understand a feature, Problem solving etc.
                    </span>
                  </td>
                  <td>On Chargeable</td>
                </tr>
                <tr className="pdf-table__row--alt">
                  <td></td>
                  <td style={{ paddingLeft: "24px" }}>
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      <strong>L2: Bugs -</strong> Bugs identified by you or by
                      BlechTek Software Solutions LLP
                    </span>
                  </td>
                  <td>Free, Under License Fee Renewal</td>
                </tr>
                <tr>
                  <td></td>
                  <td style={{ paddingLeft: "24px" }}>
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      <strong>L3: Customer Specific Enhancements -</strong>{" "}
                      New/Change in Document Printing format, New/Changes in
                      Reports, New/Change in Reports
                    </span>
                  </td>
                  <td>On Chargeable</td>
                </tr>
                <tr className="pdf-table__row--alt">
                  <td></td>
                  <td style={{ paddingLeft: "24px" }}>
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      <strong>L4: Product Upgrade -</strong> Product Upgrade as
                      done by BlechTek Software Solutions LLP on their own
                    </span>
                  </td>
                  <td>Free, Under License Fee Renewal</td>
                </tr>
                <tr>
                  <td></td>
                  <td style={{ paddingLeft: "24px" }}>
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      <strong>L5: Implementation -</strong> Master updation, new
                      feature implementation
                    </span>
                  </td>
                  <td>On Chargeable</td>
                </tr>
                <tr className="pdf-table__row--alt">
                  <td>7</td>
                  <td>
                    <strong>Taxes</strong>
                    <br />
                    <span style={{ fontSize: "9pt", color: "#333" }}>
                      As Applicable
                    </span>
                  </td>
                  <td>As Applicable</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pdf-section pdf-section--heading">
            <h3>Terms and Conditions</h3>
          </div>

          <div className="pdf-section pdf-section--terms">
            <ol>
              <li>
                <strong>Confidentiality</strong>
                <p>
                  BlechTek Software Solutions LLP agrees to maintain the
                  confidentiality of all insights gained into your organization.
                </p>
              </li>
              <li>
                <strong>License</strong>
                <p>
                  You are responsible for holding valid licenses for any
                  Operating System software required.
                </p>
              </li>
              <li>
                <strong>Ownership of Source Code</strong>
                <p>
                  Source Code remains the property of BlechTek Software
                  Solutions LLP. The customer shall not claim any right in or to
                  any patent, copyright, trademark or other proprietary right of
                  the original manufacturer, developer or licensor.
                </p>
              </li>
              <li>
                <strong>Warranty</strong>
                <p>
                  BlechTek offers a standard warranty against development
                  defects for 3 months from the date of installation. BlechTek
                  is not responsible for data loss due to platform,
                  cyber-security or virus issues.
                </p>
              </li>
              <li>
                <strong>Installation of Software</strong>
                <p>
                  The software is considered installed once loaded on the
                  server. For on-premise servers, installation follows receipt
                  of a Site Readiness report.
                </p>
              </li>
              <li>
                <strong>Excused Performance</strong>
                <p>
                  BlechTek is not liable for delay or failure in performance due
                  to strikes, riots, war, fire, acts of God, governmental
                  regulation, or failure of hardware/network outside its
                  control.
                </p>
              </li>
              <li>
                <strong>Discontinuation of Contract</strong>
                <p>
                  The balance amount becomes payable immediately if the contract
                  is discontinued for reasons unrelated to BlechTek, or stalled
                  by the client for more than 60 days.
                </p>
              </li>
              <li>
                <strong>TDS</strong>
                <p>
                  Any TDS deducted must be supported by a certificate within 6
                  months or by the end of the financial year, failing which the
                  deducted amount becomes payable.
                </p>
              </li>
              <li>
                <strong>Validity of the Offer</strong>
                <p>
                  This offer is valid up to{" "}
                  {formatValidationDate(validationDate)}.
                </p>
              </li>
              <li>
                <strong>Suggestions by Auditors / Consultants</strong>
                <p>
                  Any changes suggested by auditors or consultants must be
                  raised before order finalization; later changes are chargeable
                  separately.
                </p>
              </li>
              <li>
                <strong>Legal</strong>
                <p>
                  Disputes arising from this order are subject to the
                  jurisdiction of courts at Pune, Maharashtra.
                </p>
              </li>
            </ol>
          </div>

          <div className="pdf-section pdf-section--closing">
            <p>
              We hope this document aligns with our discussions. Please feel
              free to reach out for any clarification.
            </p>
            <p>Sincerely,</p>
            <p>For BlechTek Software Solutions LLP</p>
            <p className="pdf-signature">Sushama Inamdar</p>
          </div>

          <div className="pdf-footer">
            <p>BlechTek Software Solutions LLP</p>
            <p>
              Address: S.NO. 257/2/2A/4 ABC Business Center, S Floor, Opp.
              WindMill Village Road, WindMill Village, Bavdhan, Pune 411021,
              Maharashtra
            </p>
            <p>
              LLP No.: ACD-6620 | GST NO.: 27ABCFB0283B1Z0 | MSME Certificate
              No.: UDYAM-MH-26-0746115
            </p>
          </div>
        </div>

        {/* {result && (
          <div className="q-result q-result--bottom">
            <p className="q-result__title">Quotation generated</p>
            <p className="q-result__id">{result.quotationId}</p>
            <div className="q-result__actions">
              <button
                className="q-result__btn q-result__btn--view"
                onClick={() => {}}
              >
                View Details
              </button>
              <button
                className="q-result__btn q-result__btn--primary"
                onClick={() => {
                  const url = resolveDownloadUrl(result.pdfDownloadUrl);
                  if (url) window.open(url, "_blank");
                }}
              >
                Download PDF
              </button>
              <button
                className="q-result__btn"
                onClick={() => {
                  const url = resolveDownloadUrl(result.wordDownloadUrl);
                  if (url) window.open(url, "_blank");
                }}
              >
                Download Word
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
}
