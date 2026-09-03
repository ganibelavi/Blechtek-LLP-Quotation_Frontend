import MasterCrudPage from "./MasterCrudPage";
const fields = [
  { name: "name", label: "Name", required: true },
  { name: "address", label: "Address", type: "textarea" },
  { name: "state", label: "State" },
  { name: "stateCode", label: "State Code" },
  { name: "gstn", label: "GSTN" },
];
export default function SuppliersPage() {
  return (
    <MasterCrudPage
      title="Suppliers"
      endpoint="suppliers"
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
