from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="FoodLoop SmartMatch API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://foodloop-iota.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Donation(BaseModel):
    id: str
    city: str
    state: str
    food_type: str
    quantity: float
    safe_until: datetime


class Organization(BaseModel):
    id: str
    name: str
    organization_type: str
    city: str
    state: str
    verification_status: str


class MatchRequest(BaseModel):
    donation: Donation
    organizations: List[Organization]


def calculate_match(donation, organization):
    if organization.verification_status != "verified":
        return None

    if organization.organization_type not in ["ngo", "community_kitchen"]:
        return None

    now = datetime.now(timezone.utc)
    safe_until = donation.safe_until

    if safe_until.tzinfo is None:
        safe_until = safe_until.replace(tzinfo=timezone.utc)

    if safe_until <= now:
        return None

    city_match = organization.city.strip().lower() == donation.city.strip().lower()
    state_match = organization.state.strip().lower() == donation.state.strip().lower()

    if not state_match:
        return None

    score = 60
    reasons = ["Organisation is verified", "Organisation type is eligible"]

    if city_match:
        score += 40
        reasons.append("Located in the same city")
    else:
        reasons.append("Located in the same state")

    return {
        "organization_id": organization.id,
        "organization_name": organization.name,
        "match_score": score,
        "reasons": reasons
    }


@app.get("/")
def home():
    return {"service": "FoodLoop SmartMatch API", "status": "running"}


@app.post("/match")
def match_organizations(request: MatchRequest):
    donation = request.donation

    if donation.quantity <= 0:
        raise HTTPException(status_code=400, detail="Donation quantity must be positive")

    safe_until = donation.safe_until
    if safe_until.tzinfo is None:
        safe_until = safe_until.replace(tzinfo=timezone.utc)

    if safe_until <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Donation is no longer safe for collection")

    results = []

    for organization in request.organizations:
        result = calculate_match(donation, organization)
        if result:
            results.append(result)

    results.sort(key=lambda item: item["match_score"], reverse=True)

    return {
        "donation_id": donation.id,
        "total_matches": len(results),
        "recommendations": results
    }
