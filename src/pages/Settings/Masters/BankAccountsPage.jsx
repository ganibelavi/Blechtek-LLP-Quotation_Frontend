import MasterCrudPage from "./MasterCrudPage";
const fields = [
  { name: "bankName", label: "Bank Name" },
  { name: "accountNo", label: "Account No." },
  { name: "accountType", label: "Account Type", defaultValue: "Current" },
  { name: "ifsc", label: "IFSC" },
  {   name: "msmeNo", label: "MSME No." },
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
export default function BankAccountsPage() {
  return (
    <MasterCrudPage
      title="Bank Accounts"
      endpoint="company-bank-accounts"
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
