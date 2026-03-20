import { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { getProfile } from "../services/authService";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // 載入時確認身份
  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await getProfile();
        setIsAdmin(res.data.role === "admin");
      } catch {
        setIsAdmin(false);
      }
    };
    fetchRole();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar">

      {/* 左側 LOGO */}
      <NavLink to="/" className="navbar-logo">
        MINISHOP
      </NavLink>

      {/* 右側選單 */}
      <div className="navbar-menu">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          商品列表
        </NavLink>

        <NavLink
          to="/cart"
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          購物車
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          訂單
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            isActive ? "navbar-link active" : "navbar-link"
          }
        >
          個人資料
        </NavLink>

        {/* 只有 admin 才顯示 */}
        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive ? "navbar-link active" : "navbar-link"
            }
          >
            後台管理
          </NavLink>
        )}

        <button className="navbar-logout" onClick={handleLogout}>
          登出
        </button>
      </div>

    </nav>
  );
}