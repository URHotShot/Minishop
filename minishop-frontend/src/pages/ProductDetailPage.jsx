import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getProduct } from "../services/productService";
import { addToCart } from "../services/cartService";
import "./ProductDetailPage.css";

export default function ProductDetailPage() {
  const { id } = useParams();       // 從網址取得商品 id
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  // ===== 載入商品 =====
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await getProduct(id);
        setProduct(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError("找不到此商品");
        } else {
          setError("載入失敗，請稍後再試");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // ===== 加入購物車 =====
  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart({ product_id: product.id, quantity });
      alert(`已將 ${quantity} 件「${product.name}」加入購物車！`);
    } catch (err) {
      if (err.response?.status === 401) {
        alert("請先登入");
        navigate("/login");
      } else {
        alert(err.response?.data?.message || "加入失敗，請稍後再試");
      }
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <p className="status-message">載入中...</p>;
  if (error)   return <p className="status-message">{error}</p>;

  const isSoldOut = product.stock === 0;

  return (
    <div className="product-detail-page">

      {/* 返回商品列表 */}
      <Link to="/" className="back-link">
        ← 返回商品列表
      </Link>

      <div className="detail-card">

        {/* 名稱 & SKU */}
        <h1 className="detail-name">{product.name}</h1>
        <p className="detail-sku">SKU：{product.sku}</p>

        <hr className="detail-divider" />

        {/* 描述 */}
        {product.description && (
          <p className="detail-description">{product.description}</p>
        )}

        {/* 價格 & 庫存 */}
        <div className="detail-meta">
          <span className="detail-price">
            NT$ {product.price.toLocaleString()}
          </span>
          <span className={`detail-stock ${isSoldOut ? "out" : ""}`}>
            {isSoldOut ? "已售完" : `庫存剩 ${product.stock} 件`}
          </span>
        </div>

        <hr className="detail-divider" />

        {/* 數量選擇 */}
        {!isSoldOut && (
          <div className="quantity-row">
            <span className="quantity-label">數量</span>
            <div className="quantity-control">
              <button
                className="qty-btn"
                disabled={quantity <= 1}
                onClick={() => setQuantity(quantity - 1)}
              >
                −
              </button>
              <span className="qty-value">{quantity}</span>
              <button
                className="qty-btn"
                disabled={quantity >= product.stock}
                onClick={() => setQuantity(quantity + 1)}
              >
                ＋
              </button>
            </div>
          </div>
        )}

        {/* 加入購物車 */}
        <button
          className="add-to-cart-btn"
          disabled={isSoldOut || adding}
          onClick={handleAddToCart}
        >
          {adding ? "加入中..." : isSoldOut ? "已售完" : "加入購物車"}
        </button>

      </div>
    </div>
  );
}