import React, { useEffect, useState } from "react";
import { fetchModules, resolveDownloadUrl } from "../services/quotationApi";
import "./QuotationPdfView.css";
import "../components/QuotationPreview.css";

const initialValues = {
  organizationName: "",
  referenceBy: "",
  validationDate: "",
  selectedModules: [],
  quotationTo: { name: "", address: "", contactNo: "", email: "" },
  quotationNo: "",
  date: "",
  discountPercentage: 0,
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
    referenceBy,
    validationDate,
    selectedModules,
    quotationTo,
    quotationNo,
    date,
    discountPercentage,
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

  const displayQuotationNo = result?.quotationNo || quotationNo || "{{QUOTATION_NO}}";
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
  const modulePrice =
    scopeModules.length > 0
      ? scopeModules.reduce((sum, m) => sum + (m.price || 0), 0)
      : null;

  // Calculate discounted price
  const discountPct = discountPercentage || 0;
  const discountAmount = modulePrice !== null ? (modulePrice * discountPct / 100) : 0;
  const finalPrice = modulePrice !== null ? (modulePrice - discountAmount) : null;

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
            <h3>{organizationName ? `QUOTATION TO - ${organizationName}` : "QUOTATION TO"}</h3>
            <div className="quotation-to-grid">
              <div className="quotation-to-left">
                <p>Name: {quotationTo.name || "{{CONTACT_NAME}"}</p>
                <p>Address: {quotationTo.address || "{{CONTACT_ADDRESS}"}</p>
                <p>Contact No.: {quotationTo.contactNo || "{{CONTACT_PHONE}"}</p>
                <p>Email: {quotationTo.email || "{{CONTACT_EMAIL}"}</p>
                {/* <p>Reference By: {referenceBy || "{{REFERENCE_BY}"}</p> */}
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
              We discussed the current challenges and solutions CQUAL can provide, based on our brief discussions, please find attached a Preliminary Business Proposal for the required changeover at{" "}
              {organizationName || "{{ORG_NAME}"}.
            </p>
          </div>

          <div className="pdf-section pdf-section--heading">
            <h3>Goals and Expectations</h3>
          </div>

          <div className="pdf-section">
            <p>
              IT & Operations: Our experts will be involved in redefining the operations setup
              for sustainable growth and required digitalization at{" "}
              {organizationName || "{{ORG_NAME}"}.
            </p>
            <p>
              Digitization of {moduleList || "{{MODULE_LIST}"} replaces manual documentation, significantly accelerates approval process with centralized data management and improved traceability, reduced and lower administrative interfaces.
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

          <div className="pdf-section pdf-section--closing">
            <p>
              We hope that this Document along with the enclosed Business Proposal
              is in line with your requirements. In case of any query, please feel
              free to call us.
            </p>
            <p>Sincerely,</p>
            <p>For BlechTek Software Solutions LLP.</p>
            <p>Sushama Inamdar</p>
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
                    {/* {discountPct > 0 && modulePrice !== null && (
                      <>
                        <br />
                        <span style={{ fontSize: "9pt", color: "#666" }}>
                          Module Price: ₹{modulePrice.toLocaleString()}
                          <br />
                          Discount ({discountPct}%): -₹{discountAmount.toLocaleString()}
                          <br />
                          <strong>Net Price: ₹{finalPrice.toLocaleString()}</strong>
                        </span>
                      </>
                    )} */}
                  </td>
                  <td>
                    {modulePrice !== null && modulePrice > 0
                      ? (discountPct > 0
                          ? `₹${finalPrice.toLocaleString()}`
                          : `₹${modulePrice.toLocaleString()}`)
                      : "TBD"}
                  </td>
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
                    {/* <span style={{ fontSize: "9pt", color: "#333" }}>
                      As Applicable
                    </span> */}
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
                  We agree to maintain the secrecy of insight into your organization.
                </p>
              </li>
              <li>
                <strong>License</strong>
                <p>
                  You should hold Licenses of any Operating System Software required.
                </p>
              </li>
              <li>
                <strong>Ownership of Source Code</strong>
                <p>
                  Ownership of Source Code would be property of BlechTek Software Solutions LLP. Customer shall not claim any right whatsoever in or to any patent, copyright, trademark or other proprietary right of the original equipment manufacturer/ software developers or its licensors. The software/ hardware/ other goods supplied are in accordance with the Export laws of respective countries. Diversion of these laws/regulations is prohibited.
                </p>
              </li>
              <li>
                <strong>Warranty</strong>
                <p>
                  BlechTek Software Solutions LLP offers a Standard Warranty against Development defects for the period of 3 Months from the Date of Installation. And BlechTek Software Solutions LLP is not responsible for the loss of Data due to any Platform related or Cyber Security Issues or Virus problems.
                </p>
              </li>
              <li>
                <strong>Installation of Software</strong>
<p>
                   <strong>Definition:</strong> The Software will be considered as installed when it is loaded on the Server.
                 </p>
                 <p>
                   <strong>Installation pre-requisites (in case of on-premise Server):</strong> We will install the Software only after we receive the Site readiness report from you. A Copy of which will be forwarded to you along with our Order Acceptance / Request for Installation.
                 </p>
              </li>
              <li>
                <strong>Excused Performance</strong>
                <p>
                  BlechTek shall not be liable or deemed to be in default for any delay or failure in performance under this Contract or interruption of services due to strike or labor disputes, riots, war, fire, acts of God or governmental regulations. BlechTek should not be held responsible, directly or indirectly for nonperformance of our software due to failure or malfunction of computer or telecommunications hardware, network or related equipment at your installation site.
                </p>
              </li>
              <li>
                <strong>Discontinuation of Contract</strong>
                <p>
                  You will immediately pay the balance amount to BlechTek in case of the following…
                </p>
                <p>
                  i. Discontinuation of Contract from your side due to the reasons that are not related to BlechTek
                </p>
                <p>
                  ii. If the contract is stalled by you at any stage for a period more than 60 Days
                </p>
              </li>
              <li>
                <strong>TDS</strong>
                <p>
                  In case of deduction of TDS Amount, you have to give us the TDS certificate immediately along with our Payment. If we do not receive the TDS Certificate within 6 months or by the end of the Financial Year, you should pay us the deducted TDS amount immediately.
                </p>
              </li>
              <li>
                <strong>Validity of the Offer</strong>
                <p>
                  This Offer is valid up to {formatValidationDate(validationDate)}.
                </p>
              </li>
              <li>
                <strong>Suggestions by your Auditors and / or Consultants</strong>
                <p>
                  Any suggestions by your Auditors and / or Consultants should be discussed before the finalization of the Order. If any suggestions are made after the finalization of the order, the same will be considered only after the completion of this Order and would be charged extra.
                </p>
              </li>
              <li>
                <strong>Legal</strong>
                <p>
                  Any disputes arising out of in relation to this order is subject to jurisdiction of courts at Pune, Maharashtra.
                </p>
              </li>
            </ol>
          </div>

          <div className="pdf-section pdf-section--closing">
            <p>
              We hope that this Document along with the enclosed Business Proposal
              is in line with your requirements. In case of any query, please feel
              free to call us.
            </p>
            <p>Sincerely,</p>
            <p>For BlechTek Software Solutions LLP.</p>
            <p className="pdf-signature"><strong>Sushama Inamdar</strong></p>
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
