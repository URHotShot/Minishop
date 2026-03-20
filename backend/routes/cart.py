from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from extensions import db
from models import CartItem, Product, Order, OrderItem

cart_bp = Blueprint("cart_bp", __name__)

# 加入購物車：POST /cart/items
@cart_bp.route("/cart/items", methods=["POST"])
@jwt_required()
def add_to_cart():
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    product_id = data.get("product_id")
    qty = data.get("quantity", 1)

    if not product_id or int(qty) <= 0:
        return jsonify({"message": "Invalid product_id or quantity"}), 400

    product = Product.query.get(product_id)
    if not product:
        return jsonify({"message": "Product not found"}), 404

    # 同商品已在購物車：直接加數量
    existing = CartItem.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        existing.quantity += int(qty)
        db.session.commit()
        return jsonify({"message": "Cart item updated", "item": existing.to_dict()}), 200

    item = CartItem(user_id=user_id, product_id=product_id, quantity=int(qty))
    db.session.add(item)
    db.session.commit()
    return jsonify({"message": "Added to cart", "item": item.to_dict()}), 201


# 查看購物車：GET /cart
@cart_bp.route("/cart", methods=["GET"])
@jwt_required()
def get_cart():
    user_id = int(get_jwt_identity())
    items = CartItem.query.filter_by(user_id=user_id).order_by(CartItem.id.desc()).all()

    # 回傳時順便帶 product 資訊
    result = []
    for i in items:
        p = Product.query.get(i.product_id)
        result.append({
            "id": i.id,
            "product_id": i.product_id,
            "quantity": i.quantity,
            "product": p.to_dict() if p else None
        })

    return jsonify(result), 200


# 修改購物車數量：PUT /cart/items/<id>
@cart_bp.route("/cart/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_cart_item(item_id):
    user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    qty = data.get("quantity")

    if qty is None or int(qty) <= 0:
        return jsonify({"message": "quantity must be > 0"}), 400

    item = CartItem.query.get_or_404(item_id)
    if item.user_id != user_id:
        return jsonify({"message": "Forbidden"}), 403

    item.quantity = int(qty)
    db.session.commit()
    return jsonify({"message": "Cart item updated", "item": item.to_dict()}), 200


# 移除購物車：DELETE /cart/items/<id>
@cart_bp.route("/cart/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_cart_item(item_id):
    user_id = int(get_jwt_identity())
    item = CartItem.query.get_or_404(item_id)

    if item.user_id != user_id:
        return jsonify({"message": "Forbidden"}), 403

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Cart item deleted"}), 200


# 結帳：POST /cart/checkout
@cart_bp.route("/cart/checkout", methods=["POST"])
@jwt_required()
def checkout():
    user_id = int(get_jwt_identity())

    cart_items = CartItem.query.filter_by(user_id=user_id).all()
    if not cart_items:
        return jsonify({"message": "Cart is empty"}), 400

    try:
        # 建立訂單
        order = Order(user_id=user_id, total_amount=0, status="pending")
        db.session.add(order)
        db.session.flush()

        total = 0.0

        # 檢查庫存 + 建立明細 + 扣庫存
        for ci in cart_items:
            product = Product.query.get(ci.product_id)
            if not product:
                raise ValueError(f"Product {ci.product_id} not found")

            if product.stock < ci.quantity:
                raise ValueError(f"Product {ci.product_id} stock not enough")

            unit_price = float(product.price)
            total += unit_price * ci.quantity

            product.stock -= ci.quantity

            oi = OrderItem(
                order_id=order.id,
                product_id=ci.product_id,
                quantity=ci.quantity,
                unit_price=unit_price
            )
            db.session.add(oi)

        order.total_amount = total

        # 清空購物車
        for ci in cart_items:
            db.session.delete(ci)

        db.session.commit()

        items = OrderItem.query.filter_by(order_id=order.id).all()
        return jsonify({
            "message": "Checkout success",
            "order": order.to_dict(),
            "items": [i.to_dict() for i in items]
        }), 201

    except ValueError as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

    except Exception:
        db.session.rollback()
        return jsonify({"message": "Checkout failed"}), 500