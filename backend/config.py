import os

class Config:
    SQLALCHEMY_DATABASE_URI = os.environ.get("DB_URI", "mysql+pymysql://root:@localhost/minishop")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "change-me")