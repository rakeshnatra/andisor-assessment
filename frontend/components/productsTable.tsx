"use client";

import { useEffect, useRef, useState } from "react";
import {} from "antd";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Switch,
  message,
  Alert,
  Table,
  Collapse,
  Space,
  Tooltip,
} from "antd";
import type { TableColumnsType } from "antd";

/**
 * Data model notes:
 * This is a 3-level nested hierarchy: Product -> PrimaryVariant -> SecondaryVariant.
 * Example real-world use case: Product = "T-Shirt", PrimaryVariant = "Color" (Red/Blue),
 * SecondaryVariant = "Size" (S/M/L) under each color.
 * The naming of "Primary"/"Secondary" is generic on purpose so the same product can
 * represent different variant types (color/size, material/finish, etc.) — that's why
 * `primaryVariantName` / `secondaryVariantName` exist on Product: they're just labels
 * used to render the correct column header dynamically.
 */

interface SecondaryVariant {
  id: number;
  name: string;
  price: string | number; // API can return price as a string (e.g. decimal from DB), hence the union type
  discountPercentage: number;
  inventory: number;
}

interface PrimaryVariant {
  id: number;
  name: string;
  price: string | number;
  discountPercentage: number;
  inventory: number;
  active: boolean;
  secondaryVariants: SecondaryVariant[]; // nested one level deeper
}

interface Product {
  id: number;
  title: string;
  price: string | number;
  discountPercentage: number;
  inventory: number;
  active: boolean;
  leadTime: string;
  description: string;
  category: string;
  image: string;
  primaryVariantName: string; // e.g. "Color" - used as a dynamic column header
  secondaryVariantName: string; // e.g. "Size" - used as a dynamic column header

  primaryVariants: PrimaryVariant[];
}

export default function ProductTable() {
  // ----- Top-level product list state -----
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ----- Create / Edit Product modal state -----
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();
  // NOTE: `editingProduct === null` is what tells handleSubmitProduct whether this is a
  // "create" or "update" flow - one modal/form is reused for both actions.

  // ----- Primary variant edit modal state -----
  const [editingPrimaryVariant, setEditingPrimaryVariant] =
    useState<PrimaryVariant | null>(null);

  // ----- Secondary variant edit modal state -----
  const [editingSecondaryVariant, setEditingSecondaryVariant] =
    useState<SecondaryVariant | null>(null);

  // These two are currently set but not actually read anywhere else in the component.
  // Kept here because they'd normally be used to scope an update to a specific
  // product/primary-variant if the API required parent IDs in the request body/URL.
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null
  );
  const [selectedPrimaryVariantId, setSelectedPrimaryVariantId] =
    useState<number | null>(null);

  const [primaryModalOpen, setPrimaryModalOpen] = useState(false);
  const [secondaryModalOpen, setSecondaryModalOpen] = useState(false);

  const [savingPrimary, setSavingPrimary] = useState(false);
  const [savingSecondary, setSavingSecondary] = useState(false);

  // ----- Bulk JSON upload state -----
  const [bulkUploading, setBulkUploading] = useState(false);
  // A plain hidden <input type="file"> driven via ref, rather than antd's
  // <Upload> component — this is a one-shot "pick a file, POST it, done"
  // action, not a managed file list with previews/removal, so the extra
  // API surface of <Upload> isn't worth pulling in for it.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [primaryForm] = Form.useForm();
  const [secondaryForm] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch all products (with their nested primary/secondary variants) from the API.
  // Called on initial mount and again after any create/update so the table stays in sync.
  async function fetchProducts() {
    try {
      setLoading(true);

      const response = await fetch("http://localhost:3001/products");

      if (!response.ok) {
        throw new Error(`Failed to fetch products. Status: ${response.status}`);
      }

      const data: Product[] = await response.json();

      setProducts(data);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "Unable to load products");
    } finally {
      setLoading(false);
    }
  }

  // Original standalone "create" handler.
  // NOTE: this is effectively dead code now — the form's onFinish is wired to
  // handleSubmitProduct below, which handles both create AND edit. Left in place
  // because it's still referenced conceptually, but in a real cleanup pass I'd remove
  // this and keep only handleSubmitProduct to avoid confusion/duplication.
  async function handleCreateProduct(values: any) {
    try {
      setCreating(true);

      const response = await fetch("http://localhost:3001/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }
      message.success("Product created successfully");
      form.resetFields();
      setCreateModalOpen(false);
      await fetchProducts();
    } catch (error) {
      console.error(error);
      message.error("Unable to create product");
    } finally {
      setCreating(false);
    }
  }

  // Pre-fills the shared Create/Edit modal form with the selected product's current
  // values, then opens the modal. Numeric fields are explicitly cast with Number()
  // because `price` can come back from the API as a string.
  function handleEditProduct(product: Product) {
    setEditingProduct(product);

    form.setFieldsValue({
      title: product.title,
      price: Number(product.price),
      discountPercentage: product.discountPercentage,
      inventory: product.inventory,
      active: product.active,
      leadTime: product.leadTime,
      description: product.description,
      category: product.category,
      image: product.image,
      primaryVariantName: product.primaryVariantName,
      secondaryVariantName: product.secondaryVariantName,
    });

    setCreateModalOpen(true);
  }

  // Single submit handler for the product modal, branching on whether we're editing
  // (PATCH to /products/:id) or creating (POST to /products). Keeping one handler
  // avoids duplicating the fetch/error/message boilerplate for both flows.
  async function handleSubmitProduct(values: any) {
    try {
      setCreating(true);

      const isEditing = editingProduct !== null;

      const url = isEditing
        ? `http://localhost:3001/products/${editingProduct.id}`
        : "http://localhost:3001/products";

      const method = isEditing ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorBody = await response.text();

        console.error("Product API error:", errorBody);

        throw new Error(`Failed to save product. Status: ${response.status}`);
      }

      message.success(
        isEditing ? "Product updated successfully" : "Product created successfully"
      );

      form.resetFields();

      setEditingProduct(null);
      setCreateModalOpen(false);

      // Re-fetch rather than optimistically updating local state — simpler and
      // guarantees the UI reflects exactly what the server persisted (including
      // any server-side defaults/derived fields).
      await fetchProducts();
    } catch (error) {
      console.error(error);

      message.error("Unable to save product");
    } finally {
      setCreating(false);
    }
  }

  // Opens the "Edit Primary Variant" modal pre-filled with the selected row's values.
  function handleEditPrimaryVariant(primary: PrimaryVariant) {
    setEditingPrimaryVariant(primary);

    primaryForm.setFieldsValue({
      name: primary.name,
      price: Number(primary.price),
      discountPercentage: primary.discountPercentage,
      inventory: primary.inventory,
      active: primary.active,
    });

    setPrimaryModalOpen(true);
  }

  // Primary variants only support update (PATCH) here, not create/delete from this UI.
  async function handleSavePrimaryVariant(values: any) {
    if (!editingPrimaryVariant) return;

    try {
      setSavingPrimary(true);

      const response = await fetch(
        `http://localhost:3001/primary-variants/${editingPrimaryVariant.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();

        console.error("Primary variant update error:", errorBody);

        throw new Error("Failed to update primary variant");
      }

      message.success("Primary variant updated successfully");

      primaryForm.resetFields();
      setEditingPrimaryVariant(null);
      setPrimaryModalOpen(false);

      // Re-fetch the whole product tree since a primary variant update can affect
      // what's displayed in the parent product's expanded row.
      await fetchProducts();
    } catch (error) {
      console.error(error);

      message.error("Unable to update primary variant");
    } finally {
      setSavingPrimary(false);
    }
  }

  // Opens the "Edit Secondary Variant" modal pre-filled with the selected row's values.
  // Note: secondary variants have no `active` flag in the model, so it's intentionally
  // omitted here (unlike the primary variant form).
  function handleEditSecondaryVariant(secondary: SecondaryVariant) {
    setEditingSecondaryVariant(secondary);

    secondaryForm.setFieldsValue({
      name: secondary.name,
      price: Number(secondary.price),
      discountPercentage: secondary.discountPercentage,
      inventory: secondary.inventory,
    });

    setSecondaryModalOpen(true);
  }

  async function handleSaveSecondaryVariant(values: any) {
    if (!editingSecondaryVariant) return;

    try {
      setSavingSecondary(true);

      const response = await fetch(
        `http://localhost:3001/secondary-variants/${editingSecondaryVariant.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        }
      );

      if (!response.ok) {
        const errorBody = await response.text();

        console.error("Secondary variant update error:", errorBody);

        throw new Error("Failed to update secondary variant");
      }

      message.success("Secondary variant updated successfully");

      secondaryForm.resetFields();
      setEditingSecondaryVariant(null);
      setSecondaryModalOpen(false);

      await fetchProducts();
    } catch (error) {
      console.error(error);

      message.error("Unable to update secondary variant");
    } finally {
      setSavingSecondary(false);
    }
  }

  // Fires when the user picks a file from the hidden input. Sends it to the
  // bulk-upload endpoint, which queues each product for async creation on
  // the backend (see ProductsProcessor) and responds immediately — it does
  // NOT wait for the products to actually be created, so don't expect the
  // table to reflect the new products right after this resolves.
  async function handleBulkUploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    // Reset the input's value immediately so selecting the *same* file
    // again later still fires onChange (browsers don't fire change events
    // for an unchanged file input value).
    e.target.value = "";

    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setBulkUploading(true);

      const response = await fetch("http://localhost:3001/products/bulk-upload", {
        method: "POST",
        body: formData, // no Content-Type header — the browser sets the
        // correct multipart/form-data boundary automatically; setting it
        // manually here would actually break the upload.
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Bulk upload error:", errorBody);
        throw new Error(`Bulk upload failed. Status: ${response.status}`);
      }

      const result: { message: string; queued: number } = await response.json();

      message.success(
        `${result.message} — refresh the table in a few seconds to see them appear.`
      );

      // Products are created asynchronously by the backend worker, so an
      // immediate re-fetch likely won't show them yet. A short delay gives
      // the queue a head start; the user can still manually refresh sooner.
      setTimeout(fetchProducts, 2000);
    } catch (error) {
      console.error(error);
      message.error("Unable to upload products file");
    } finally {
      setBulkUploading(false);
    }
  }

  // Load products once on mount. fetchProducts is stable (defined in component body,
  // no external deps captured that change), so an empty dependency array is safe here.
  useEffect(() => {
    fetchProducts();
  }, []);

  // Early return: if the initial fetch failed, show an error state instead of an
  // empty/broken table.
  if (error) {
    return (
      <Alert type="error" message="Unable to load products" description={error} showIcon />
    );
  }

  // Top-level table column definitions for the Product list.
  const columns: TableColumnsType<Product> = [
    // {
    //   title: "ID",
    //   dataIndex: "id",
    //   key: "id",
    //   // width: 70,
    // },
    {
      title: "Product Name",
      dataIndex: "title",
      key: "title",
    },
    {

      title: "Variants",
      key: "colors",
      render: (_, product) => {
        const variants = product.primaryVariants ?? [];
        const looksLikeColor = product.primaryVariantName ?.toLowerCase().includes("color");

        if (variants.length === 0) {
          return "—";
        }

        if (!looksLikeColor) {
          return `${variants.length} ${product.primaryVariantName || "variant"}(s)`;
        }

        return (
          <Space size={4}>
            {variants.map((variant) => (
              <Tooltip key={variant.id} title={variant.name}>
                <span
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    backgroundColor: variant.name,
                    border: "1px solid #d9d9d9",
                  }}
                />
              </Tooltip>
            ))}
          </Space>
        );
      },
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      // Format as currency; Number() guards against the API returning price as a string.
      render: (price) => `$${Number(price).toFixed(2)}`,
    },
    {
      title: "Discount %",
      dataIndex: "discountPercentage",
      key: "discountPercentage",
    },
    {
      title: "Stock",
      dataIndex: "inventory",
      key: "inventory",
    },
    {
      title: "Active",
      dataIndex: "active",
      key: "active",
      render: (active: boolean) => (active ? "Yes" : "No"),
    },
    {
      title: "Lead Time",
      dataIndex: "leadTime",
      key: "leadTime",
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => handleEditProduct(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginBottom: 16,
        }}
      >
        {/* Hidden native file input — the visible button below just proxies
            clicks to it via the ref, which is the standard way to get a
            custom-styled "upload" button instead of the browser's default
            file-input chrome. */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={handleBulkUploadFile}
        />
        <Button loading={bulkUploading} onClick={() => fileInputRef.current?.click()}>
          Upload Products (JSON)
        </Button>
        <Button
          type="primary"
          onClick={() => {
            // Reset "edit mode" so the shared modal knows this is a create, not an edit.
            setEditingProduct(null);

            form.resetFields();

            // Sensible defaults for a brand-new product.
            form.setFieldsValue({
              active: true,
              discountPercentage: 0,
              inventory: 0,
              primaryVariantName: "Color",
              secondaryVariantName: "Size",
            });

            setCreateModalOpen(true);
          }}
        >
          + Create Product
        </Button>
      </div>

      {/*
        Main products table.
        `expandable` is used to build the 3-level drill-down:
        Product row expands -> nested PrimaryVariant table
          -> each PrimaryVariant row expands -> nested SecondaryVariant table
        This is all done via Ant Design's built-in row expansion rather than routing
        to separate pages, which keeps the whole hierarchy browsable in one view.
      */}
      <Table<Product>
        rowKey="id"
        columns={columns}
        dataSource={products}
        pagination={{
          current: currentPage,
          pageSize: 5,
          total: products.length,
          showSizeChanger: false,
          onChange: (page) => {
            setCurrentPage(page);
          },
        }}
        loading={loading}
        expandable={{
          // Renders the PrimaryVariant table nested inside an expanded Product row.
          expandedRowRender: (product) => {
            const primaryColumns: TableColumnsType<PrimaryVariant> = [
              // {
              //   title: "ID",
              //   dataIndex: "id",
              //   key: "id",
              // },
              {
                // Column header is dynamic — uses the product's own label
                // (e.g. "Color") instead of a hardcoded "Primary Variant".
               title: product.primaryVariantName || "Primary Variant",
                dataIndex: "name",
                key: "name",
                render: (name: string) => {
                  const looksLikeColor = product.primaryVariantName
                    ?.toLowerCase()
                    .includes("color");
 
                  if (!looksLikeColor) {
                    return name;
                  }
 
                  // Same swatch treatment as the main table's "Colors"
                  // column, just inline with the text here instead of
                  // stacked dots — this is a single row, so there's only
                  // ever one name/dot pair to show per row.
                  return (
                    <Space size={6}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: name,
                          border: "1px solid #d9d9d9",
                        }}
                      />
                      {name}
                    </Space>
                  );
                },
              },
              {
                title: "Price",
                dataIndex: "price",
                key: "price",
                render: (price) => `$${Number(price).toFixed(2)}`,
              },
              {
                title: "Discount %",
                dataIndex: "discountPercentage",
                key: "discountPercentage",
              },
              {
                title: "Stock",
                dataIndex: "inventory",
                key: "inventory",
              },
              {
                title: "Active",
                dataIndex: "active",
                key: "active",
                render: (active: boolean) => (active ? "Yes" : "No"),
              },
              {
                title: "Actions",
                key: "actions",
                width: 100,
                render: (_, primary) => (
                  <Button type="link" onClick={() => handleEditPrimaryVariant(primary)}>
                    Edit
                  </Button>
                ),
              },
            ];

            return (
              <Table<PrimaryVariant>
                rowKey="id"
                columns={primaryColumns}
                dataSource={product.primaryVariants ?? []} // guard against undefined
                pagination={false}
                size="small"
                expandable={{
                  // Renders the SecondaryVariant table nested inside an expanded
                  // PrimaryVariant row — third level of the hierarchy.
                  expandedRowRender: (primary) => {
                    const secondaryColumns: TableColumnsType<SecondaryVariant> = [
                      // {
                      //   title: "ID",
                      //   dataIndex: "id",
                      //   key: "id",
                      // },
                      {
                        title: product.secondaryVariantName || "Secondary Variant",
                        dataIndex: "name",
                        key: "name",
                      },
                      {
                        title: "Price",
                        dataIndex: "price",
                        key: "price",
                        render: (price) => `$${Number(price).toFixed(2)}`,
                      },
                      {
                        title: "Discount %",
                        dataIndex: "discountPercentage",
                        key: "discountPercentage",
                      },
                      {
                        title: "Stock",
                        dataIndex: "inventory",
                        key: "inventory",
                      },
                      {
                        title: "Actions",
                        key: "actions",
                        width: 100,
                        render: (_, secondary) => (
                          <Button
                            type="link"
                            onClick={() => handleEditSecondaryVariant(secondary)}
                          >
                            Edit
                          </Button>
                        ),
                      },
                    ];

                    return (
                      <div style={{ padding: "8px 24px" }}>
                        <Table<SecondaryVariant>
                          rowKey="id"
                          columns={secondaryColumns}
                          dataSource={primary.secondaryVariants ?? []}
                          pagination={false}
                          size="small"
                        />
                      </div>
                    );
                  },

                  // Only show the expand arrow if there's actually something to expand into.
                  rowExpandable: (primary) =>
                    (primary.secondaryVariants?.length ?? 0) > 0,
                }}
              />
            );
          },

          rowExpandable: (product) => (product.primaryVariants?.length ?? 0) > 0,
        }}
      />

      {/*
        Shared Create/Edit Product modal.
        Title, submit label, and create-vs-update behavior are all derived from
        `editingProduct` being null (create) or set (edit) — see handleSubmitProduct.
      */}
      <Modal
        title={editingProduct ? "Edit Product" : "Create Product"}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          setEditingProduct(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={creating}
        okText={editingProduct ? "Save Changes" : "Create Product"}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitProduct}
          initialValues={{
            active: true,
            discountPercentage: 0,
            inventory: 0,
            primaryVariantName: "Color",
            secondaryVariantName: "Size",
          }}
        >
          <Form.Item
            label="Product Name"
            name="title"
            rules={[{ required: true, message: "Please enter product name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Discount Percentage" name="discountPercentage">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Inventory"
            name="inventory"
            rules={[{ required: true, message: "Please enter inventory" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Lead Time"
            name="leadTime"
            rules={[{ required: true, message: "Please enter lead time" }]}
          >
            <Input placeholder="e.g. 2 weeks" />
          </Form.Item>

          <Form.Item
            label="Category"
            name="category"
            rules={[{ required: true, message: "Please enter category" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: "Please enter description" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item
            label="Image URL"
            name="image"
            rules={[{ required: true, message: "Please enter image URL" }]}
          >
            <Input />
          </Form.Item>

          {/* These two fields control the dynamic column headers used further up
              in the nested primary/secondary variant tables (e.g. "Color", "Size"). */}
          <Form.Item label="Primary Variant Name" name="primaryVariantName">
            <Input />
          </Form.Item>

          <Form.Item label="Secondary Variant Name" name="secondaryVariantName">
            <Input />
          </Form.Item>

          <Form.Item label="Active" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Primary Variant modal — update only, no create/delete from this view. */}
      <Modal
        title="Edit Primary Variant"
        open={primaryModalOpen}
        onCancel={() => {
          setPrimaryModalOpen(false);
          setEditingPrimaryVariant(null);
          primaryForm.resetFields();
        }}
        onOk={() => primaryForm.submit()}
        confirmLoading={savingPrimary}
        okText="Save Changes"
      >
        <Form form={primaryForm} layout="vertical" onFinish={handleSavePrimaryVariant}>
          <Form.Item
            label="Variant Name"
            name="name"
            rules={[{ required: true, message: "Please enter variant name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Discount Percentage" name="discountPercentage">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Inventory"
            name="inventory"
            rules={[{ required: true, message: "Please enter inventory" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Active" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Secondary Variant modal — no "Active" toggle since SecondaryVariant
          has no `active` field in the data model. */}
      <Modal
        title="Edit Secondary Variant"
        open={secondaryModalOpen}
        onCancel={() => {
          setSecondaryModalOpen(false);
          setEditingSecondaryVariant(null);
          secondaryForm.resetFields();
        }}
        onOk={() => secondaryForm.submit()}
        confirmLoading={savingSecondary}
        okText="Save Changes"
      >
        <Form form={secondaryForm} layout="vertical" onFinish={handleSaveSecondaryVariant}>
          <Form.Item
            label="Variant Name"
            name="name"
            rules={[{ required: true, message: "Please enter variant name" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Price"
            name="price"
            rules={[{ required: true, message: "Please enter price" }]}
          >
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Discount Percentage" name="discountPercentage">
            <InputNumber min={0} max={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Inventory"
            name="inventory"
            rules={[{ required: true, message: "Please enter inventory" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}