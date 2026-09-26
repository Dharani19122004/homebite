import VendorCatalog from "../../components/customer/VendorCatalog";

function Groceries() {
  return (
    <VendorCatalog
      vendorType="grocery"
      title="Groceries"
      description="Fresh groceries from approved grocery vendors."
      basePath="/customer/groceries"
    />
  );
}

export default Groceries;
