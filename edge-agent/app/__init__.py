from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    EDGE_ID: str = "edge-rpi-001"
    API_BASE_URL: str = "http://localhost:8000"
    API_TOKEN: str = "device-token"
    RTSP_URL: str = "rtsp://camera.local/stream"


settings = Settings()
