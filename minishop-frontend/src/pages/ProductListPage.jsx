import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getProducts } from "../services/productService";
import { addToCart } from "../services/cartService";
import "./ProductListPage.css";

export default function ProductListPage() {
  const navigate = useNavigate();

  // ===== 商品資料 =====
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ===== 搜尋 / 排序 / 分頁 =====
  const [keyword, setKeyword] = useState("");
  const [debouncedKeyword, setDebouncedKeyword] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const limit = 12; // 每頁幾筆

  // ===== 加入購物車狀態（記錄哪個商品正在處理）=====
  const [addingId, setAddingId] = useState(null);

  // keyword 停止輸入 300ms 後才更新 debouncedKeyword
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // ===== 撈商品 =====
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getProducts({ keyword: debouncedKeyword, sort, page, limit });
      setProducts(res.data.products);
      setTotal(res.data.total);
    } catch (err) {
      setError("無法載入商品，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  // debouncedKeyword / sort 改變時回到第一頁
  useEffect(() => {
    setPage(1);
  }, [debouncedKeyword, sort]);

  // page / debouncedKeyword / sort 任一改變就重新撈資料
  useEffect(() => {
    fetchProducts();
  }, [page, debouncedKeyword, sort]);

  // ===== 加入購物車 =====
  const handleAddToCart = async (productId) => {
    setAddingId(productId);
    try {
      await addToCart({ product_id: productId, quantity: 1 });
      alert("已加入購物車！");
    } catch (err) {
      if (err.response?.status === 401) {
        alert("請先登入");
        navigate("/login");
      } else {
        alert(err.response?.data?.message || "加入失敗，請稍後再試");
      }
    } finally {
      setAddingId(null);
    }
  };

  // ===== 分頁計算 =====
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="product-list-page">

      {/* 工具列：搜尋 + 排序 */}
      <div className="toolbar">
        <input
          className="search-input"
          type="text"
          placeholder="搜尋商品名稱..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <select
          className="sort-select"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">最新上架</option>
          <option value="price_asc">價格低到高</option>
          <option value="price_desc">價格高到低</option>
        </select>
      </div>

      {/* 商品數量提示 */}
      {!loading && (
        <p className="result-info">
          共 {total} 件商品
          {keyword && `，搜尋「${keyword}」`}
        </p>
      )}

      {/* 載入中 */}
      {loading && <p className="status-message">載入中...</p>}

      {/* 錯誤訊息 */}
      {error && <p className="status-message">{error}</p>}

      {/* 商品列表 */}
      {!loading && !error && (
        <>
          {products.length === 0 ? (
            <p className="status-message">找不到符合的商品</p>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <div className="product-card" key={product.id}>
                  <p className="product-name">
                    <Link to={`/products/${product.id}`}>{product.name}</Link>
                  </p>
                  <p className="product-sku">SKU：{product.sku}</p>

                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}

                  <div className="product-footer">
                    <span className="product-price">
                      NT$ {product.price.toLocaleString()}
                    </span>
                    <span className={`product-stock ${product.stock === 0 ? "out" : ""}`}>
                      {product.stock === 0 ? "已售完" : `庫存 ${product.stock}`}
                    </span>
                  </div>

                  <button
                    className="add-to-cart-btn"
                    disabled={product.stock === 0 || addingId === product.id}
                    onClick={() => handleAddToCart(product.id)}
                  >
                    {addingId === product.id
                      ? "加入中..."
                      : product.stock === 0
                      ? "已售完"
                      : "加入購物車"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 分頁 */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                上一頁
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`page-btn ${p === page ? "current" : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}

              <button
                className="page-btn"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一頁
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}