# app.py
from flask import Flask
from config import Config
from extensions import db, jwt, cors

app = Flask(__name__)
app.config.from_object(Config)

# 初始化擴充套件
db.init_app(app)
jwt.init_app(app)
cors.init_app(app)

# 載入路由
from routes.user import user_bp
from routes.product import product_bp
from routes.order import order_bp
from routes.cart import cart_bp

app.register_blueprint(user_bp)
app.register_blueprint(product_bp)
app.register_blueprint(order_bp)
app.register_blueprint(cart_bp)

with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return "minishop API is running!"

if __name__ == "__main__":
    app.run(debug=True)