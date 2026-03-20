from flask import Blueprint, request, jsonify
from extensions import db
from models import Order, OrderItem, Product
from flask_jwt_extended import jwt_required, get_jwt_identity

order_bp = Blueprint("order_bp", __name__)

# 下單：POST /orders
@order_bp.route("/orders", methods=["POST"])
@jwt_required()
def create_order():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    items = data.get("items", [])

    if not items or not isinstance(items, list):
        return jsonify({"message": "items must be a list"}), 400

    # 先建立訂單
    order = Order(user_id=user_id, total_amount=0, status="pending")
    db.session.add(order)
    db.session.flush()  # 取得 order.id（還沒 commit）

    total = 0.0

    # 逐項建立 order_item + 扣庫存
    for item in items:
        product_id = item.get("product_id")
        qty = item.get("quantity")

        if not product_id or not qty or qty <= 0:
            db.session.rollback()
            return jsonify({"message": "Invalid product_id or quantity"}), 400

        product = Product.query.get(product_id)
        if not product:
            db.session.rollback()
            return jsonify({"message": f"Product {product_id} not found"}), 404

        if product.stock < qty:
            db.session.rollback()
            return jsonify({"message": f"Product {product_id} stock not enough"}), 400

        unit_price = float(product.price)
        total += unit_price * qty

        # 扣庫存
        product.stock -= qty
        
        order_item = OrderItem(
            order_id=order.id,
            product_id=product_id,
            quantity=qty,
            unit_price=unit_price
        )
        db.session.add(order_item)

    order.total_amount = total
    db.session.commit()

    return jsonify({
        "order": order.to_dict(),
        "items": [oi.to_dict() for oi in OrderItem.query.filter_by(order_id=order.id).all()]
    }), 201

# 我的訂單：GET /orders
@order_bp.route("/orders", methods=["GET"])
@jwt_required()
def my_orders():
    user_id = int(get_jwt_identity())

    # 取得分頁參數
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 10, type=int)

    query = Order.query.filter_by(user_id=user_id).order_by(Order.id.desc())

    # 總筆數
    total = query.count()

    # 分頁
    orders = query.offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "page": page,
        "limit": limit,
        "total": total,
        "data": [o.to_dict() for o in orders]
    }), 200

# 我的訂單詳情：GET /orders/<id>
@order_bp.route("/orders/<int:order_id>", methods=["GET"])
@jwt_required()
def my_order_detail(order_id):
    user_id = int(get_jwt_identity())
    order = Order.query.get_or_404(order_id)

    if order.user_id != user_id:
        return jsonify({"message": "Forbidden"}), 403

    items = OrderItem.query.filter_by(order_id=order_id).all()
    return jsonify({
        "order": order.to_dict(),
        "items": [i.to_dict() for i in items]
    }), 200

# 取消訂單: POST /orders/<order_id>/cancel
@order_bp.route("/orders/<int:order_id>/cancel", methods=["PUT"])
@jwt_required()
def cancel_order(order_id):
    user_id = int(get_jwt_identity())
    
    order = Order.query.get_or_404(order_id)

    # 只能取消自己的訂單
    if order.user_id != user_id:
        return jsonify({"message": "Forbidden"}), 403
    
    # 只能取消 pending 的訂單
    if order.status != "pending":
        return jsonify({"message": "Only pending orders can be cancelled"}), 400
    
    # 找到訂單商品
    items = OrderItem.query.filter_by(order_id=order_id).all()

    # 補回庫存
    for item in items:
        product = Product.query.get(item.product_id)
        if product:
            product.stock += item.quantity

    # 更新訂單狀態
    order.status = "cancelled"
    
    db.session.commit()
    
    return jsonify({
        "message": "Order cancelled successfully",
        "order": order.to_dict()
    }), 200