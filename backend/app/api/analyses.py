"""Thin handlers for the four approved FinTrace business operations."""

from __future__ import annotations

from typing import Annotated, cast

from fastapi import APIRouter, Depends, File, Path, Request, UploadFile, status

from app.models.contract import (
    AnalysisResult,
    AnalysisStatusResponse,
    CreateAnalysisResponse,
    EvidenceDetail,
)
from app.services.analysis import AnalysisService

router = APIRouter()


def analysis_service(request: Request) -> AnalysisService:
    return cast(AnalysisService, request.app.state.analysis_service)


Service = Annotated[AnalysisService, Depends(analysis_service)]
AnalysisId = Annotated[str, Path(alias="analysisId", min_length=1)]
EvidenceId = Annotated[str, Path(alias="evidenceId", min_length=1)]


@router.post(
    "/api/v1/analyses",
    response_model=CreateAnalysisResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_analysis(
    files: Annotated[list[UploadFile], File()], service: Service
) -> CreateAnalysisResponse:
    return await service.create(files)


@router.get(
    "/api/v1/analyses/{analysisId}/status",
    response_model=AnalysisStatusResponse,
)
async def get_analysis_status(
    analysis_id: AnalysisId,
    service: Service,
) -> AnalysisStatusResponse:
    return await service.status(analysis_id)


@router.get(
    "/api/v1/analyses/{analysisId}/result",
    response_model=AnalysisResult,
)
async def get_analysis_result(
    analysis_id: AnalysisId,
    service: Service,
) -> AnalysisResult:
    return await service.result(analysis_id)


@router.get(
    "/api/v1/analyses/{analysisId}/evidence/{evidenceId}",
    response_model=EvidenceDetail,
)
async def get_evidence_detail(
    analysis_id: AnalysisId,
    evidence_id: EvidenceId,
    service: Service,
) -> EvidenceDetail:
    return await service.evidence(analysis_id, evidence_id)
