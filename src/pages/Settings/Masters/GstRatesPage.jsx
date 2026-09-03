import MasterCrudPage from "./MasterCrudPage";
const fields = [
  { name: "label", label: "Label", required: true },
  { name: "sgstPct", label: "SGST %", type: "number", defaultValue: 0 },
  { name: "cgstPct", label: "CGST %", type: "number", defaultValue: 0 },
  { name: "igstPct", label: "IGST %", type: "number", defaultValue: 0 },
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
export default function GstRatesPage() {
  return (
    <MasterCrudPage
      title="GST Rates"
      endpoint="gst-rates"
      fields={fields}
      columns={fields.map(({ name, label }) => ({
        key: name,
        label,
        sortable: true,
        minWidth: 120,
      }))}
    />
  );
}
