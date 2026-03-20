# product.py
from flask import Blueprint, request, jsonify
from extensions import db
from models import Product
from flask_jwt_extended import jwt_required

product_bp = Blueprint("product_bp", __name__)

# 取得所有商品（公開）
@product_bp.route("/products", methods=["GET"])
def list_products():
    # 加入分頁、搜尋、排序功能
    page = request.args.get("page", 1, type=int)
    limit = request.args.get("limit", 20, type=int)
    keyword = request.args.get("keyword", "", type=str).strip()
    sort = request.args.get("sort", "newest", type=str)

    # 防呆
    if page < 1:
        page = 1
    if limit < 1:
        limit = 20
    if limit > 50:
        limit = 50

    query = Product.query

    # 關鍵字搜尋
    if keyword:
        query = query.filter(Product.name.ilike(f"%{keyword}%"))

    # 排序
    if sort == "price_asc":
        query = query.order_by(Product.price.asc())
    elif sort == "price_desc":
        query = query.order_by(Product.price.desc())
    else:
        # newest：用 id desc 當作新到舊
        query = query.order_by(Product.id.desc())
    
    # 總筆數
    total = query.count()

    # 分頁
    products = query.offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "products": [p.to_dict() for p in products]
    }), 200



# 取得單一商品（公開）
@product_bp.route("/products/<int:product_id>", methods=["GET"])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict()), 200

# 新增商品（先要求登入）
from utils.auth import admin_required
@product_bp.route("/products", methods=["POST"])
@jwt_required()
def create_product():
    err = admin_required()
    if err:
        return err
    
    data = request.get_json() or {}
    sku = data.get("sku")
    name = data.get("name")
    price = data.get("price")
    add_stock = data.get("stock", 0)

    if not sku or not name or price is None or add_stock is None:
        return jsonify({"message": "sku, name, price and stock are required"}), 400

    if int(add_stock) < 0:
        return jsonify({"message": "stock must be non-negative"}), 400
    
    # 檢查 SKU 是否已存在
    existing_product = Product.query.filter_by(sku=sku).first()

    # 已存在：補庫存
    if existing_product:
        
        existing_product.stock += int(add_stock)

        # 同步更新資訊
        if data.get("name") is not None:
            existing_product.name = data.get("name")
        if data.get("description") is not None:
            existing_product.description = data.get("description")
        if data.get("price") is not None:
            existing_product.price = float(data.get("price"))
        
        db.session.commit()
        return jsonify({"message": "Stock increased", "product": existing_product.to_dict()}), 200

    # 不存在：新增商品
    product = Product(
        sku=sku,
        name=name,
        description=data.get("description"),
        price=float(price),
        stock=int(data.get("stock", 0))
    )
    db.session.add(product)
    db.session.commit()

    return jsonify({"message": "Product created", "product": product.to_dict()}), 201

# 更新商品（先要求登入）
@product_bp.route("/products/<int:product_id>", methods=["PUT"])
@jwt_required()
def update_product(product_id):
    err = admin_required()
    if err:
        return err
    product = Product.query.get_or_404(product_id)
    data = request.get_json() or {}

    if "name" in data:
        product.name = data["name"]
    if "description" in data:
        product.description = data["description"]
    if "price" in data:
        product.price = float(data["price"])
    if "stock" in data:
        product.stock = int(data["stock"])
    if "sku" in data:
        product.sku = data["sku"]

    db.session.commit()
    return jsonify(product.to_dict()), 200

# 刪除商品（先要求登入）
@product_bp.route("/products/<int:product_id>", methods=["DELETE"])
@jwt_required()
def delete_product(product_id):
    err = admin_required()
    if err:
        return err
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({"message": "Product deleted"}), 200