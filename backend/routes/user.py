# routes/user.py
from flask import Blueprint, request, jsonify
from extensions import db
from models import User
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity

user_bp = Blueprint("user_bp", __name__)

# 使用者註冊
@user_bp.route("/register", methods=["POST"])
def register():
    # 取得前端資料
    data = request.get_json()
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    # 欄位檢查
    if not username or not email or not password:
        return jsonify({"message": "Missing fields"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "Email already exists"}), 400
    
    # 建立新使用者並存入資料庫
    hashed_password = generate_password_hash(password)
    new_user = User(username=username, email=email, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"message": "User registered successfully"}), 201

# 使用者登入
@user_bp.route("/login", methods=["POST"])
def login():
    # 取得前端資料
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    # 欄位檢查
    if not email or not password:
        return jsonify({"message": "Missing fields"}), 400

    # 查詢使用者並驗證密碼
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"message": "Invalid credentials"}), 401

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role}
    )
    return jsonify({"access_token": access_token}), 200

# 需要登入才能訪問的使用者資料頁面
@user_bp.route("/profile", methods=["GET"])
@jwt_required()  # <- 這裡驗證 token
def profile():
    user_id = get_jwt_identity()  # 取出登入者 ID
    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role
    }), 200