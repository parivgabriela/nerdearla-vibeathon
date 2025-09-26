from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg://postgres:admin@localhost:5432/semillero"
    coordinator_emails: List[str] = []
    teacher_emails: List[str] = []
    cors_origins: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = ""
        case_sensitive = False


settings = Settings()
