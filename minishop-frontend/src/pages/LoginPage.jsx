import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../services/authService";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // 清除錯誤訊息
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await login(form);
      // 將 JWT token 存入 localStorage
      localStorage.setItem("token", res.data.access_token);
      navigate("/"); // 登入成功跳轉首頁
    } catch (err) {
      setError(
        err.response?.data?.message || "登入失敗，請確認帳號或密碼是否正確"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">

        {/* 標題 */}
        <div className="login-header">
          <h1>MINISHOP</h1>
          <p>請登入你的帳號</p>
        </div>

        {/* 表單 */}
        <form className="login-form" onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="email">電子信箱</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="請輸入電子信箱"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="請輸入密碼"
              required
            />
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <div className="error-message">{error}</div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? "登入中..." : "登入"}
          </button>

        </form>

        {/* 跳轉註冊 */}
        <div className="login-footer">
          還沒有帳號？{" "}
          <Link to="/register">立即註冊</Link>
        </div>

      </div>
    </div>
  );
}
