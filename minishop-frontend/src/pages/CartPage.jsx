import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getCart, updateItem, deleteItem, checkout } from "../services/cartService";
import "./CartPage.css";

export default function CartPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");

  // ===== 載入購物車 =====
  const fetchCart = async () => {
    setLoading(true);
    try {
      const res = await getCart();
      setItems(res.data);
    } catch {
      setError("無法載入購物車");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // ===== 修改數量 =====
  const handleQuantityChange = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await updateItem(itemId, { quantity: newQty });
      // 直接更新本地狀態，不用重新打 API
      setItems(items.map((i) =>
        i.id === itemId ? { ...i, quantity: newQty } : i
      ));
    } catch {
      alert("更新失敗，請稍後再試");
    }
  };

  // ===== 刪除項目 =====
  const handleDelete = async (itemId) => {
    try {
      await deleteItem(itemId);
      setItems(items.filter((i) => i.id !== itemId));
    } catch {
      alert("刪除失敗，請稍後再試");
    }
  };

  // ===== 結帳 =====
  const handleCheckout = async () => {
    if (!window.confirm("確定要結帳嗎？")) return;
    setCheckingOut(true);
    try {
      await checkout();
      alert("結帳成功！");
      navigate("/orders");
    } catch (err) {
      alert(err.response?.data?.message || "結帳失敗，請稍後再試");
    } finally {
      setCheckingOut(false);
    }
  };

  // ===== 計算總金額 =====
  const totalAmount = items.reduce((sum, item) => {
    return sum + (item.product?.price ?? 0) * item.quantity;
  }, 0);

  // ===== 渲染 =====
  if (loading) return <p className="status-message">載入中...</p>;
  if (error)   return <p className="status-message">{error}</p>;

  return (
    <div className="cart-page">
      <h1>購物車</h1>

      {items.length === 0 ? (
        <div className="cart-empty">
          <p>購物車是空的</p>
          <Link to="/">去逛逛商品</Link>
        </div>
      ) : (
        <>
          {/* 購物車項目 */}
          <div className="cart-list">
            {items.map((item) => (
              <div className="cart-item" key={item.id}>

                {/* 商品資訊 */}
                <div className="cart-item-info">
                  <p className="cart-item-name">{item.product?.name}</p>
                  <p className="cart-item-price">
                    NT$ {item.product?.price.toLocaleString()} / 件
                  </p>
                </div>

                {/* 數量調整 */}
                <div className="quantity-control">
                  <button
                    className="qty-btn"
                    disabled={item.quantity <= 1}
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="qty-value">{item.quantity}</span>
                  <button
                    className="qty-btn"
                    disabled={item.quantity >= item.product?.stock}
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  >
                    ＋
                  </button>
                </div>

                {/* 小計 */}
                <div className="cart-item-subtotal">
                  NT$ {((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                </div>

                {/* 刪除 */}
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(item.id)}
                  title="移除"
                >
                  ✕
                </button>

              </div>
            ))}
          </div>

          {/* 結帳摘要 */}
          <div className="cart-summary">
            <div className="summary-row">
              <span className="summary-label">共 {items.length} 件商品</span>
              <span className="summary-total">
                NT$ {totalAmount.toLocaleString()}
              </span>
            </div>
            <button
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={checkingOut}
            >
              {checkingOut ? "結帳中..." : "立即結帳"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}