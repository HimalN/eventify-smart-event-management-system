"""Registrations API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.registration import Registration
from app.models.event import Event
from app.schemas.registration import RegistrationResponse, RegistrationCreate, CheckInRequest, CheckInResponse
from app.services import registration_service

router = APIRouter(prefix="/registrations", tags=["Registrations"])



@router.get("", response_model=List[RegistrationResponse])
def get_registrations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Non-admin / non-organizer can only see their own registrations
    if current_user.role == "participant":
        regs = registration_service.get_registrations(db, participant_id=current_user.id)
    else:
        # Admin or Organizer can see all registrations
        regs = registration_service.get_registrations(db)
        
    response_list = []
    for r in regs:
        # Load event title
        ev = db.query(Event).filter(Event.id == r.event_id).first()
        response_list.append(RegistrationResponse(
            id=r.id,
            event_id=r.event_id,
            event_title=ev.title if ev else "Campus Event",
            participant=r.participant_name,
            email=r.participant_email,
            registered_at=r.registration_date.strftime("%Y-%m-%d"),
            status=r.confirmation_status,
            attendance=r.attendance_status,
            ticket_code=r.ticket_code,
            checked_in_at=r.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if r.checked_in_at else None,
        ))
    return response_list


@router.post("", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegistrationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        # Use details of current logged-in user if participant
        name = current_user.name
        email = current_user.email
        # If admin/organizer registering someone else, let them supply name/email
        if current_user.role != "participant":
            if request.participant_name and request.email:
                name = request.participant_name
                email = request.email

        reg = await registration_service.create_registration(
            db,
            event_id=request.event_id,
            participant_id=current_user.id if current_user.role == "participant" else None,
            participant_name=name,
            participant_email=email,
        )
        
        # Load event title
        ev = db.query(Event).filter(Event.id == reg.event_id).first()
        return RegistrationResponse(
            id=reg.id,
            event_id=reg.event_id,
            event_title=ev.title if ev else "Campus Event",
            participant=reg.participant_name,
            email=reg.participant_email,
            registered_at=reg.registration_date.strftime("%Y-%m-%d"),
            status=reg.confirmation_status,
            attendance=reg.attendance_status,
            ticket_code=reg.ticket_code,
            checked_in_at=reg.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if reg.checked_in_at else None,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{id}")
async def cancel_registration(id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Check permission
    reg = db.query(Registration).filter(Registration.id == id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
        
    if current_user.role == "participant" and reg.participant_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to cancel this registration")

    success = await registration_service.cancel_registration(db, id, actor_name=current_user.name)
    if not success:
        raise HTTPException(status_code=404, detail="Registration not found")
    return {"success": True, "message": "Registration cancelled successfully"}


@router.post("/check-in", response_model=CheckInResponse)
async def check_in(
    request: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        res = await registration_service.check_in_participant(
            db=db,
            ticket_code=request.ticket_code,
            event_id=request.event_id,
            actor_name=current_user.name,
        )
        reg = res["registration"]
        ev = res.get("event")
        
        reg_response = None
        if reg:
            reg_response = RegistrationResponse(
                id=reg.id,
                event_id=reg.event_id,
                event_title=ev.title if ev else "Campus Event",
                participant=reg.participant_name,
                email=reg.participant_email,
                registered_at=reg.registration_date.strftime("%Y-%m-%d"),
                status=reg.confirmation_status,
                attendance=reg.attendance_status,
                ticket_code=reg.ticket_code,
                checked_in_at=reg.checked_in_at.strftime("%Y-%m-%d %H:%M:%S") if reg.checked_in_at else None,
            )

        return CheckInResponse(
            success=res["success"],
            message=res["message"],
            registration=reg_response,
            already_checked_in=res.get("already_checked_in", False),
            timestamp=res["timestamp"],
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

