import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class BaseConfig:
    SECRET_KEY = os.getenv("SECRET_KEY")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}

    CACHE_TYPE = "SimpleCache"
    CACHE_DEFAULT_TIMEOUT = 300

    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")

    BCRYPT_ROUNDS = int(os.getenv("BCRYPT_ROUNDS", 10))
    BUSINESS_HOURS_START = 8
    BUSINESS_HOURS_END = 18


class DevelopmentConfig(BaseConfig):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://dev:car_db2026@localhost:5432/car_db",
    )


class StagingConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")


class ProductionConfig(BaseConfig):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    CACHE_TYPE = "RedisCache"
    CACHE_REDIS_URL = os.getenv("REDIS_URL")


config_by_name = {
    "development": DevelopmentConfig,
    "staging": StagingConfig,
    "production": ProductionConfig,
}