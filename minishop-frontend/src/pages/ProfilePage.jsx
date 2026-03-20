import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getProfile } from "../services/authService";
import "./ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate("/login");
        } else {
          setError("無法載入個人資料");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading)          return <p className="status-message">載入中...</p>;
  if (error)            return <p className="status-message">{error}</p>;
  if (!profile)         return <p className="status-message">找不到資料</p>;

  return (
    <div className="profile-page">
      <h1>個人資料</h1>

      <div className="profile-card">

        {/* 頭像區 */}
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div className="profile-avatar-info">
            <h2>{profile.username}</h2>
            <p>{profile.email}</p>
          </div>
        </div>

        {/* 資料列表 */}
        <div className="profile-info-list">
          <div className="profile-info-item">
            <span className="profile-info-label">帳號 ID</span>
            <span className="profile-info-value">#{profile.id}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">使用者名稱</span>
            <span className="profile-info-value">{profile.username}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">電子信箱</span>
            <span className="profile-info-value">{profile.email}</span>
          </div>
          <div className="profile-info-item">
            <span className="profile-info-label">身份</span>
            <span className={`profile-role-badge ${profile.role ?? "user"}`}>
              {profile.role === "admin" ? "管理員" : "一般用戶"}
            </span>
          </div>
        </div>

        {/* 快捷按鈕 */}
        <div className="profile-actions">
          <Link to="/orders" className="profile-action-btn">
            我的訂單
          </Link>
          <Link to="/" className="profile-action-btn">
            繼續購物
          </Link>
          <button className="profile-action-btn logout" onClick={handleLogout}>
            登出
          </button>
        </div>

      </div>
    </div>
  );
}