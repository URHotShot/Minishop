import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";
import "./RegisterPage.css";

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // 清除該欄位的錯誤
    setFieldErrors({ ...fieldErrors, [e.target.name]: "" });
    setError("");
  };

  // 前端驗證
  const validate = () => {
    const errors = {};
    if (!form.username.trim()) {
      errors.username = "帳號不能為空";
    } else if (form.username.length < 3) {
      errors.username = "帳號至少 3 個字元";
    }
    if (!form.email.trim()) {
      errors.email = "信箱不能為空";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = "信箱格式不正確";
    }
    if (!form.password) {
      errors.password = "密碼不能為空";
    } else if (form.password.length < 6) {
      errors.password = "密碼至少 6 個字元";
    }
    if (!form.confirmPassword) {
      errors.confirmPassword = "請再次輸入密碼";
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = "兩次密碼不相符";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 前端驗證
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
      });
      setSuccess("註冊成功！2 秒後跳轉至登入頁...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "註冊失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">

        {/* 標題 */}
        <div className="register-header">
          <h1>MINISHOP</h1>
          <p>建立你的帳號</p>
        </div>

        {/* 表單 */}
        <form className="register-form" onSubmit={handleSubmit}>

          {/* 帳號 */}
          <div className="form-group">
            <label htmlFor="username">帳號</label>
            <input
              id="username"
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="請輸入帳號（至少 3 個字元）"
              className={fieldErrors.username ? "input-error" : ""}
            />
            {fieldErrors.username && (
              <span className="field-error">{fieldErrors.username}</span>
            )}
          </div>

          {/* 電子信箱 */}
          <div className="form-group">
            <label htmlFor="email">電子信箱</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="請輸入電子信箱"
              className={fieldErrors.email ? "input-error" : ""}
            />
            {fieldErrors.email && (
              <span className="field-error">{fieldErrors.email}</span>
            )}
          </div>

          {/* 密碼 */}
          <div className="form-group">
            <label htmlFor="password">密碼</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="請輸入密碼（至少 6 個字元）"
              className={fieldErrors.password ? "input-error" : ""}
            />
            {fieldErrors.password && (
              <span className="field-error">{fieldErrors.password}</span>
            )}
          </div>

          {/* 確認密碼 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">確認密碼</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="請再次輸入密碼"
              className={fieldErrors.confirmPassword ? "input-error" : ""}
            />
            {fieldErrors.confirmPassword && (
              <span className="field-error">{fieldErrors.confirmPassword}</span>
            )}
          </div>

          {/* 全域錯誤訊息 */}
          {error && <div className="error-message">{error}</div>}

          {/* 成功訊息 */}
          {success && <div className="success-message">{success}</div>}

          <button
            type="submit"
            className="register-button"
            disabled={loading || !!success}
          >
            {loading ? "註冊中..." : "註冊"}
          </button>

        </form>

        {/* 跳轉登入 */}
        <div className="register-footer">
          已經有帳號？{" "}
          <Link to="/login">立即登入</Link>
        </div>

      </div>
    </div>
  );
}
