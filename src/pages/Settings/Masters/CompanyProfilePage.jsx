import MasterCrudPage from "./MasterCrudPage";
const fields = [
  { name: "name", label: "Name", required: true },
  { name: "address", label: "Address", type: "textarea" },
  { name: "state", label: "State" },
  { name: "stateCode", label: "State Code" },
  { name: "gstn", label: "GSTN" },
  {
    name: "defaultTermsOfSale",
    label: "Default Terms of Sale",
    type: "textarea",
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
export default function CompanyProfilePage() {
  return (
    <MasterCrudPage
      title="Company Profile"
      endpoint="company-profile"
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
