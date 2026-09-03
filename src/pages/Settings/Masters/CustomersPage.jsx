import MasterCrudPage from "./MasterCrudPage";
const fields = [
  { name: "name", label: "Name", required: true },
  { name: "address", label: "Address", type: "textarea" },
  { name: "state", label: "State" },
  { name: "stateCode", label: "State Code" },
  { name: "gstn", label: "GSTN" },
];
export default function CustomersPage() {
  return (
    <MasterCrudPage
      title="Customers"
      endpoint="customers"
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
