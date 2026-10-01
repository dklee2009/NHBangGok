import html

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, List, Any

from database import get_db
from auth import get_current_user
import models
import schemas

router = APIRouter(prefix="/stamps", tags=["stamps"])


@router.get("")
def get_stamps(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """유저의 모든 스탬프를 { sido: { sigungu: [stamps] } } 형태로 반환"""
    stamps = db.query(models.Stamp).filter(models.Stamp.user_id == current_user.id).all()

    result: Dict[str, Dict[str, List[Dict]]] = {}
    for s in stamps:
        sido = result.setdefault(s.sido_name, {})
        sigungu = sido.setdefault(s.sigungu_name, [])
        sigungu.append({
            "branchId": s.branch_id,
            # 엔티티를 풀기 전(예: "&lt;출&gt;")에 저장된 기존 스탬프도 원래 이름으로 보이게 한다
            "branchName": html.unescape(s.branch_name),
            "category": s.category,
            "visitedAt": s.visited_at.isoformat(),
        })
    return {"visited": result}


@router.post("", response_model=schemas.StampOut)
def add_stamp(
    body: schemas.StampCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = (
        db.query(models.Stamp)
        .filter(
            models.Stamp.user_id == current_user.id,
            models.Stamp.branch_id == body.branch_id,
            models.Stamp.category == body.category,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="이미 찍은 스탬프입니다")

    stamp = models.Stamp(
        user_id=current_user.id,
        sido_name=body.sido_name,
        sigungu_name=body.sigungu_name,
        branch_id=body.branch_id,
        branch_name=html.unescape(body.branch_name),
        category=body.category,
    )
    db.add(stamp)
    db.commit()
    db.refresh(stamp)
    return stamp