from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Defense Surveillance System API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # YOLOv8 Real-Time Detection
    YOLO_MODEL_PATH: str = "yolov8n.pt"
    IP_CAM_URL: str = "http://10.64.50.165:8080/video"
    YOLO_CONFIDENCE: float = 0.45
    YOLO_TARGET_FPS: int = 15

    # Roboflow Bomb Detection
    ROBOFLOW_API_KEY: str = ""
    ROBOFLOW_MODEL_ID: str = "bomb-detection/1"
    ROBOFLOW_TARGET_FPS: int = 10

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug_flag(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production", "false", "0", "off", "no"}:
                return False
            if normalized in {"debug", "development", "dev", "true", "1", "on", "yes"}:
                return True
        return value

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
