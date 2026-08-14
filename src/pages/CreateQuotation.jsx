import React, { useEffect, useState } from "react";
import QuotationForm, { validate } from "../components/QuotationForm";
import QuotationPreview from "../components/QuotationPreview";
import { fetchModules, generateQuotation } from "../services/quotationApi";
import "./CreateQuotation.css";

const initialValues = {
  organizationName: "",
  validationDate: "",
  selectedModules: [],
  quotationTo: { name: "", address: "", contactNo: "", email: "" }
};

export default function CreateQuotation() {
  const [modules, setModules] = useState([]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    fetchModules()
      .then(setModules)
      .catch(() => setApiError("Could not load the module list. Is the API running?"));
  }, []);

  const handleFieldChange = (field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
  };

  const handleQuotationToChange = (field, value) => {
    setValues((v) => ({ ...v, quotationTo: { ...v.quotationTo, [field]: value } }));
  };

  const handleToggleModule = (moduleName) => {
    setValues((v) => {
      const exists = v.selectedModules.includes(moduleName);
      return {
        ...v,
        selectedModules: exists
          ? v.selectedModules.filter((m) => m !== moduleName)
          : [...v.selectedModules, moduleName]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    setApiError("");
    setResult(null);
    try {
      const payload = {
        validationDate: values.validationDate,
        organizationName: values.organizationName,
        selectedModules: values.selectedModules,
        quotationTo: {
          name: values.quotationTo.name,
          address: values.quotationTo.address,
          contactNo: values.quotationTo.contactNo,
          email: values.quotationTo.email
        }
      };
      const data = await generateQuotation(payload);
      setResult(data);
    } catch (err) {
      setApiError(
        err.response?.data?.error || "Something went wrong while generating the quotation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-main">
      <div className="create-quotation__intro">
        <h2>New quotation</h2>
        <p>Fill in the client details and pick the modules in scope — everything else follows the standard BlechTek format.</p>
      </div>

      <div className="create-quotation__layout">
        <div className="create-quotation__card">
          <QuotationForm
            values={values}
            errors={errors}
            modules={modules}
            onFieldChange={handleFieldChange}
            onQuotationToChange={handleQuotationToChange}
            onToggleModule={handleToggleModule}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>

        <QuotationPreview values={values} result={result} error={apiError} />
      </div>
    </div>
  );
}
