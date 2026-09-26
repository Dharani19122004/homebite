import VendorCatalog from "../../components/customer/VendorCatalog";

function Restaurants() {
  return (
    <VendorCatalog
      vendorType="restaurant"
      title="Restaurants"
      description="Order from approved restaurants near you."
      basePath="/customer/restaurants"
    />
  );
}

export default Restaurants;
