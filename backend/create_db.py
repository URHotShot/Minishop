from app import db, app
import models

# 用 app context 才能建立資料表
with app.app_context():
    db.create_all()
    print("資料表建立完成！")