from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt

def admin_required():
    """
    先驗證 JWT，再檢查 role 是否為 admin
    用法：在路由函式內第一行呼叫
    """
    verify_jwt_in_request()
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"message": "Admin only"}), 403
    return None