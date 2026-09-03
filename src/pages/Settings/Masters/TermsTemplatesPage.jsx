import MasterCrudPage from "./MasterCrudPage";
const fields = [
  {
    name: "type",
    label: "Type",
    required: true,
    type: "select",
    options: [
      { value: "terms_of_sale", label: "Terms of Sale" },
      { value: "payment_terms", label: "Payment Terms" },
      { value: "delivery_terms", label: "Delivery Terms" },
    ],
  },
  { name: "label", label: "Label", required: true },
  { name: "content", label: "Content", required: true, type: "textarea" },
  {
    name: "isDefault",
    label: "Default",
    type: "select",
    defaultValue: false,
    options: [
      { value: true, label: "Yes" },
      { value: false, label: "No" },
    ],
  },
  {
    name: "isActive",
    label: "Active",
    type: "select",
    defaultValue: true,
    options: [
      { value: true, label: "Active" },
      { value: false, label: "Inactive" },
    ],
  },
];
export default function TermsTemplatesPage() {
  return (
    <MasterCrudPage
      title="Terms Templates"
      endpoint="terms-templates"
      fields={fields}
      columns={fields.map(({ name, label }) => ({
        key: name,
        label,
        sortable: true,
        minWidth: 140,
      }))}
    />
  );
}
