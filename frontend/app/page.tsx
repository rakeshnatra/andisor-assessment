import ProductTable from "@/components/productsTable";
export default function Home() {
  return (
    <main style={{ padding: "24px" }}>
      <h1 style={{ marginBottom: "24px" }}>
        Product Inventory
      </h1>

      <ProductTable />
    </main>
  );
}