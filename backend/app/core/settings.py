"""Typed local-only backend settings."""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="FINTRACE_", extra="ignore")

    stage_interval_seconds: float = Field(default=0.9, gt=0)
