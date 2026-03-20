import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders, getOrder, cancelOrder } from "../services/orderService";
import "./OrderPage.css";

// 狀態中文對照
const STATUS_LABEL = {
  pending:   "待處理",
  completed: "已完成",
  cancelled: "已取消",
};

// 日期格式化
const formatDate = (isoString) => {
  const d = new Date(isoString);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function OrderPage() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 展開的訂單 id
  const [expandedId, setExpandedId] = useState(null);
  // 各訂單明細快取 { [orderId]: items[] }
  const [detailCache, setDetailCache] = useState({});
  const [detailLoading, setDetailLoading] = useState(false);

  // 取消中的訂單 id
  const [cancellingId, setCancellingId] = useState(null);

  const limit = 10;

  // ===== 載入訂單列表 =====
  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getOrders({ page, limit });
      setOrders(res.data.data);
      setTotal(res.data.total);
    } catch {
      setError("無法載入訂單，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page]);

  // ===== 展開 / 收合訂單明細 =====
  const handleToggle = async (orderId) => {
    // 收合
    if (expandedId === orderId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(orderId);

    // 已有快取就不再打 API
    if (detailCache[orderId]) return;

    setDetailLoading(true);
    try {
      const res = await getOrder(orderId);
      setDetailCache((prev) => ({ ...prev, [orderId]: res.data.items }));
    } catch {
      setDetailCache((prev) => ({ ...prev, [orderId]: [] }));
    } finally {
      setDetailLoading(false);
    }
  };

  // ===== 取消訂單 =====
  const handleCancel = async (orderId) => {
    if (!window.confirm("確定要取消這筆訂單嗎？")) return;
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      // 更新本地狀態，不用重新打列表 API
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || "取消失敗，請稍後再試");
    } finally {
      setCancellingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  if (loading) return <p className="status-message">載入中...</p>;
  if (error)   return <p className="status-message">{error}</p>;

  return (
    <div className="order-page">
      <h1>我的訂單</h1>

      {orders.length === 0 ? (
        <div className="order-empty">
          <p>還沒有訂單紀錄</p>
          <Link to="/">去逛逛商品</Link>
        </div>
      ) : (
        <>
          <div className="order-list">
            {orders.map((order) => (
              <div className="order-card" key={order.id}>

                {/* 訂單標頭（點擊展開）*/}
                <div className="order-header" onClick={() => handleToggle(order.id)}>
                  <div className="order-header-left">
                    <span className="order-id">訂單 #{order.id}</span>
                    <span className="order-date">{formatDate(order.created_at)}</span>
                  </div>
                  <div className="order-header-right">
                    <span className="order-total">
                      NT$ {order.total_amount.toLocaleString()}
                    </span>
                    <span className={`order-status ${order.status}`}>
                      {STATUS_LABEL[order.status] ?? order.status}
                    </span>
                    <span className={`order-arrow ${expandedId === order.id ? "open" : ""}`}>
                      ▼
                    </span>
                  </div>
                </div>

                {/* 展開的訂單明細 */}
                {expandedId === order.id && (
                  <div className="order-detail">
                    {detailLoading && !detailCache[order.id] ? (
                      <p className="detail-loading">載入明細中...</p>
                    ) : (
                      (detailCache[order.id] ?? []).map((item) => (
                        <div className="order-item-row" key={item.id}>
                          <span className="order-item-name">商品 #{item.product_id}</span>
                          <span className="order-item-qty">× {item.quantity}</span>
                          <span className="order-item-price">
                            NT$ {(item.unit_price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      ))
                    )}

                    {/* 只有 pending 才能取消 */}
                    {order.status === "pending" && (
                      <button
                        className="cancel-btn"
                        disabled={cancellingId === order.id}
                        onClick={() => handleCancel(order.id)}
                      >
                        {cancellingId === order.id ? "取消中..." : "取消訂單"}
                      </button>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>

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