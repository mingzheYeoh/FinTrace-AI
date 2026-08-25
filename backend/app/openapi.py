"""Loading for the protected, committed FinTrace OpenAPI document."""

from __future__ import annotations

from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any, cast

import yaml
from openapi_spec_validator import validate

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
OPENAPI_PATH = REPOSITORY_ROOT / "docs" / "api" / "openapi.yaml"


@lru_cache(maxsize=1)
def _validated_openapi_document() -> dict[str, Any]:
    with OPENAPI_PATH.open(encoding="utf-8") as source:
        document = yaml.safe_load(source)
    if not isinstance(document, dict):
        raise RuntimeError("The committed OpenAPI document must be a mapping.")
    validate(document)
    return cast(dict[str, Any], document)


def load_openapi_document() -> dict[str, Any]:
    """Return a defensive copy of the validated committed OpenAPI document."""
    return deepcopy(_validated_openapi_document())
