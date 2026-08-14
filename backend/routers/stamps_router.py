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
            "branchName": s.branch_name,
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
        .filter(models.Stamp.user_id == current_user.id, models.Stamp.branch_id == body.branch_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="이미 찍은 스탬프입니다")

    stamp = models.Stamp(
        user_id=current_user.id,
        sido_name=body.sido_name,
        sigungu_name=body.sigungu_name,
        branch_id=body.branch_id,
        branch_name=body.branch_name,
    )
    db.add(stamp)
    db.commit()
    db.refresh(stamp)
    return stamp