import { useState, useEffect } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../services/productService";
import { getProfile } from "../services/authService";
import "./AdminPage.css";

const EMPTY_FORM = {
  sku: "", name: "", description: "", price: "", stock: ""
};

export default function AdminPage() {
  const [isAdmin, setIsAdmin]     = useState(null); // null=載入中
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // 表單狀態
  const [showForm, setShowForm]   = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null=新增, object=編輯
  const [form, setForm]           = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // ===== 確認 admin 身份 =====
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await getProfile();
        setIsAdmin(res.data.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  // ===== 載入商品 =====
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts({ limit: 50 });
      setProducts(res.data.products);
    } catch {
      // 忽略
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchProducts();
  }, [isAdmin]);

  // ===== 表單處理 =====
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFormError("");
  };

  const openAddForm = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditTarget(product);
    setForm({
      sku:         product.sku,
      name:        product.name,
      description: product.description ?? "",
      price:       String(product.price),
      stock:       String(product.stock),
    });
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.sku || !form.name || !form.price || !form.stock) {
      setFormError("SKU、名稱、價格、庫存為必填");
      return;
    }

    const payload = {
      sku:         form.sku,
      name:        form.name,
      description: form.description,
      price:       parseFloat(form.price),
      stock:       parseInt(form.stock),
    };

    setSubmitting(true);
    try {
      if (editTarget) {
        // 編輯
        await updateProduct(editTarget.id, payload);
        setProducts(products.map((p) =>
          p.id === editTarget.id ? { ...p, ...payload } : p
        ));
      } else {
        // 新增
        const res = await createProduct(payload);
        setProducts([res.data.product, ...products]);
      }
      closeForm();
    } catch (err) {
      setFormError(err.response?.data?.message || "操作失敗，請稍後再試");
    } finally {
      setSubmitting(false);
    }
  };

  // ===== 刪除商品 =====
  const handleDelete = async (product) => {
    if (!window.confirm(`確定要刪除「${product.name}」嗎？`)) return;
    try {
      await deleteProduct(product.id);
      setProducts(products.filter((p) => p.id !== product.id));
    } catch (err) {
      alert(err.response?.data?.message || "刪除失敗");
    }
  };

  // ===== 渲染 =====
  if (isAdmin === null) return <p className="status-message">載入中...</p>;

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <div className="admin-forbidden">
          <h2>⛔ 無權限</h2>
          <p>此頁面僅限管理員使用</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>後台管理</h1>

      {/* ===== 新增 / 編輯表單 ===== */}
      {showForm && (
        <div className="admin-form-card">
          <h2>{editTarget ? `編輯商品：${editTarget.name}` : "新增商品"}</h2>
          <form className="admin-form" onSubmit={handleSubmit}>

            <div className="form-group">
              <label>SKU *</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="例：PROD-001"
                disabled={!!editTarget} // 編輯時不能改 SKU
              />
            </div>

            <div className="form-group">
              <label>商品名稱 *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="請輸入商品名稱"
              />
            </div>

            <div className="form-group">
              <label>價格 *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                placeholder="例：299"
              />
            </div>

            <div className="form-group">
              <label>庫存 *</label>
              <input
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                placeholder="例：100"
              />
            </div>

            <div className="form-group full-width">
              <label>商品描述</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="選填，商品說明..."
              />
            </div>

            {formError && (
              <div className="form-group full-width">
                <span style={{ color: "#dc2626", fontSize: "13px" }}>{formError}</span>
              </div>
            )}

            <div className="admin-form-actions">
              <button type="button" className="btn-cancel-form" onClick={closeForm}>
                取消
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? "儲存中..." : editTarget ? "儲存變更" : "新增商品"}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ===== 商品列表 ===== */}
      <div className="admin-list-card">
        <div className="admin-list-header">
          <h2>商品列表（共 {products.length} 件）</h2>
          {!showForm && (
            <button className="btn-add" onClick={openAddForm}>
              ＋ 新增商品
            </button>
          )}
        </div>

        {loading ? (
          <p className="admin-empty">載入中...</p>
        ) : products.length === 0 ? (
          <p className="admin-empty">尚無商品，點右上角新增第一件商品！</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>名稱</th>
                <th>價格</th>
                <th>庫存</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="td-sku">{product.sku}</td>
                  <td>{product.name}</td>
                  <td className="td-price">
                    NT$ {product.price.toLocaleString()}
                  </td>
                  <td className={`td-stock ${
                    product.stock === 0 ? "out" : product.stock <= 5 ? "low" : ""
                  }`}>
                    {product.stock === 0 ? "售完" : product.stock}
                  </td>
                  <td>
                    <div className="td-actions">
                      <button
                        className="btn-edit"
                        onClick={() => openEditForm(product)}
                      >
                        編輯
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(product)}
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}