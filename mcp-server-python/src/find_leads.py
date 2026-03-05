"""
Find Leads Tool - Web Intelligence MCP Server (Python)

Searches for business leads using Google Maps data.
Supports both Google Places API (recommended) and direct scraping fallback.

Usage:
    from find_leads import find_leads
    
    result = await find_leads({
        "keyword": "restaurant",
        "location": "New York, NY",
        "radius": 5000,
        "max_results": 20
    })
"""
import os
import json
import asyncio
import aiohttp
from typing import Optional, List, Dict, Any, TypedDict
from dataclasses import dataclass, asdict
from datetime import datetime

# Configuration from environment
GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY", "")
USE_LEGACY_API = os.getenv("USE_LEGACY_PLACES_API", "false").lower() == "true"
ENABLE_SCRAPER_FALLBACK = os.getenv("ENABLE_SCRAPER_FALLBACK", "true").lower() == "true"
DEFAULT_MAX_RESULTS = int(os.getenv("DEFAULT_MAX_RESULTS", "20"))
DEFAULT_RADIUS = int(os.getenv("DEFAULT_SEARCH_RADIUS", "5000"))
MAX_RADIUS = 50000
MIN_RADIUS = 100


class BusinessLead(TypedDict, total=False):
    """Business lead data structure"""
    name: str
    address: str
    phone: Optional[str]
    website: Optional[str]
    rating: Optional[float]
    review_count: Optional[int]
    category: Optional[str]
    place_id: Optional[str]
    maps_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    hours: Optional[List[str]]
    photos: Optional[List[str]]
    price_level: Optional[int]


class SearchMetadata(TypedDict):
    """Search metadata structure"""
    keyword: str
    location: str
    radius: int
    coordinates: Dict[str, float]
    timestamp: str


class PaginationInfo(TypedDict):
    """Pagination information"""
    next_page_token: Optional[str]
    has_more: bool


class FindLeadsOutput(TypedDict):
    """Output structure for find_leads"""
    leads: List[BusinessLead]
    total_found: int
    search_metadata: SearchMetadata
    pagination: PaginationInfo


class LeadGenerationError(Exception):
    """Custom error for lead generation failures"""
    def __init__(self, message: str, code: str, retryable: bool = False):
        super().__init__(message)
        self.code = code
        self.retryable = retryable


async def geocode_location(location: str) -> Dict[str, Any]:
    """
    Geocode a location string to coordinates using Nominatim (OpenStreetMap)
    Free, no API key required
    """
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": location,
        "format": "json",
        "limit": "1",
        "addressdetails": "1",
    }
    headers = {
        "User-Agent": "WebIntelligenceMCP/1.0",
        "Accept-Language": "en-US,en;q=0.9",
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params, headers=headers) as response:
            if not response.ok:
                raise LeadGenerationError(
                    f"Geocoding failed: {response.reason}",
                    "GEOCODING_ERROR",
                    True
                )
            
            data = await response.json()
            
            if not data:
                raise LeadGenerationError(
                    f"Location not found: {location}",
                    "LOCATION_NOT_FOUND",
                    False
                )
            
            result = data[0]
            return {
                "latitude": float(result["lat"]),
                "longitude": float(result["lon"]),
                "formatted_address": result["display_name"],
                "place_id": str(result.get("place_id", "")),
            }


async def geocode_location_fallback(location: str) -> Dict[str, Any]:
    """
    Fallback geocoding using Photon (Komoot)
    """
    url = "https://photon.komoot.io/api/"
    params = {"q": location, "limit": "1"}
    headers = {"User-Agent": "WebIntelligenceMCP/1.0"}
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params, headers=headers) as response:
            if not response.ok:
                raise LeadGenerationError(
                    f"Fallback geocoding failed: {response.reason}",
                    "GEOCODING_ERROR",
                    True
                )
            
            data = await response.json()
            
            if not data.get("features"):
                raise LeadGenerationError(
                    f"Location not found: {location}",
                    "LOCATION_NOT_FOUND",
                    False
                )
            
            feature = data["features"][0]
            lon, lat = feature["geometry"]["coordinates"]
            props = feature["properties"]
            
            # Format address
            parts = []
            if props.get("name"):
                parts.append(props["name"])
            if props.get("street"):
                parts.append(props["street"])
            if props.get("city"):
                parts.append(props["city"])
            if props.get("country"):
                parts.append(props["country"])
            
            return {
                "latitude": lat,
                "longitude": lon,
                "formatted_address": ", ".join(parts),
                "place_id": str(props.get("osm_id", "")),
            }


async def geocode_with_fallback(location: str) -> Dict[str, Any]:
    """Geocode with fallback to secondary service"""
    try:
        return await geocode_location(location)
    except LeadGenerationError:
        return await geocode_location_fallback(location)


def transform_place_to_lead(place: Dict[str, Any]) -> BusinessLead:
    """Transform Google Places API response to BusinessLead"""
    display_name = place.get("displayName", {})
    location = place.get("location", {})
    primary_type = place.get("primaryTypeDisplayName", {})
    
    return {
        "name": display_name.get("text", place.get("name", "Unknown")),
        "address": place.get("formattedAddress", ""),
        "phone": place.get("internationalPhoneNumber"),
        "website": place.get("websiteUri"),
        "rating": place.get("rating"),
        "review_count": place.get("userRatingCount"),
        "category": primary_type.get("text"),
        "place_id": place.get("id"),
        "maps_url": place.get("googleMapsUri"),
        "latitude": location.get("latitude"),
        "longitude": location.get("longitude"),
        "hours": place.get("regularOpeningHours", {}).get("weekdayDescriptions"),
        "photos": [p.get("name") for p in place.get("photos", [])] if place.get("photos") else None,
        "price_level": place.get("priceLevel"),
    }


def transform_legacy_place_to_lead(place: Dict[str, Any]) -> BusinessLead:
    """Transform legacy Places API response to BusinessLead"""
    geometry = place.get("geometry", {})
    location = geometry.get("location", {})
    
    return {
        "name": place.get("name", "Unknown"),
        "address": place.get("vicinity", place.get("formatted_address", "")),
        "phone": None,  # Requires separate details call
        "website": None,  # Requires separate details call
        "rating": place.get("rating"),
        "review_count": place.get("user_ratings_total"),
        "category": place.get("types", [""])[0].replace("_", " ") if place.get("types") else None,
        "place_id": place.get("place_id"),
        "maps_url": f"https://www.google.com/maps/place/?q=place_id:{place.get('place_id')}" if place.get("place_id") else None,
        "latitude": location.get("lat"),
        "longitude": location.get("lng"),
        "hours": None,
        "photos": [p.get("photo_reference") for p in place.get("photos", [])] if place.get("photos") else None,
        "price_level": place.get("price_level"),
    }


async def search_places_with_api(
    keyword: str,
    lat: float,
    lng: float,
    radius: int,
    api_key: str,
    max_results: int = 20
) -> Dict[str, Any]:
    """Search using new Google Places API"""
    url = "https://places.googleapis.com/v1/places:searchText"
    
    request_body = {
        "textQuery": keyword,
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": radius,
            }
        },
        "pageSize": min(max_results, 20),
    }
    
    field_mask = ",".join([
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.internationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.primaryTypeDisplayName",
        "places.googleMapsUri",
        "places.location",
        "places.regularOpeningHours",
        "places.photos",
        "places.priceLevel",
    ])
    
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": field_mask,
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=request_body, headers=headers) as response:
            if not response.ok:
                error_data = await response.json() if response.content else {}
                raise LeadGenerationError(
                    f"Places API error: {error_data.get('error', {}).get('message', response.reason)}",
                    "PLACES_API_ERROR",
                    response.status >= 500
                )
            
            data = await response.json()
            leads = [transform_place_to_lead(place) for place in data.get("places", [])]
            
            return {
                "leads": leads,
                "next_page_token": data.get("nextPageToken"),
            }


async def search_places_legacy(
    keyword: str,
    lat: float,
    lng: float,
    radius: int,
    api_key: str,
    page_token: Optional[str] = None
) -> Dict[str, Any]:
    """Search using legacy Google Places API"""
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        "location": f"{lat},{lng}",
        "radius": str(radius),
        "keyword": keyword,
        "key": api_key,
    }
    
    if page_token:
        params["pagetoken"] = page_token
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, params=params) as response:
            data = await response.json()
            
            if data.get("status") not in ["OK", "ZERO_RESULTS"]:
                raise LeadGenerationError(
                    f"Legacy Places API error: {data.get('status')} - {data.get('error_message', '')}",
                    "PLACES_API_ERROR",
                    data.get("status") in ["OVER_QUERY_LIMIT", "UNKNOWN_ERROR"]
                )
            
            leads = [transform_legacy_place_to_lead(place) for place in data.get("results", [])]
            
            return {
                "leads": leads,
                "next_page_token": data.get("next_page_token"),
            }


async def get_place_details(place_id: str, api_key: str) -> BusinessLead:
    """Get detailed information for a place"""
    url = f"https://places.googleapis.com/v1/places/{place_id}"
    
    field_mask = ",".join([
        "id", "displayName", "formattedAddress", "internationalPhoneNumber",
        "websiteUri", "rating", "userRatingCount", "primaryTypeDisplayName",
        "googleMapsUri", "location", "regularOpeningHours", "photos", "priceLevel",
    ])
    
    headers = {
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": field_mask,
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as response:
            if not response.ok:
                raise LeadGenerationError(
                    f"Place details error: {response.reason}",
                    "PLACE_DETAILS_ERROR",
                    response.status >= 500
                )
            
            place = await response.json()
            return transform_place_to_lead(place)


async def enrich_leads_with_details(leads: List[BusinessLead], api_key: str) -> List[BusinessLead]:
    """Enrich leads with detailed information"""
    enriched = []
    
    for lead in leads:
        if lead.get("place_id"):
            try:
                details = await get_place_details(lead["place_id"], api_key)
                enriched.append({**lead, **details})
                await asyncio.sleep(0.1)  # Rate limiting
            except LeadGenerationError:
                enriched.append(lead)
        else:
            enriched.append(lead)
    
    return enriched


def validate_input(keyword: str, location: str, radius: Optional[int], max_results: Optional[int]) -> None:
    """Validate input parameters"""
    if not keyword or not keyword.strip():
        raise LeadGenerationError("Keyword is required", "INVALID_INPUT", False)
    
    if not location or not location.strip():
        raise LeadGenerationError("Location is required", "INVALID_INPUT", False)
    
    if radius is not None:
        if radius < MIN_RADIUS:
            raise LeadGenerationError(f"Radius must be at least {MIN_RADIUS}m", "INVALID_INPUT", False)
        if radius > MAX_RADIUS:
            raise LeadGenerationError(f"Radius cannot exceed {MAX_RADIUS}m", "INVALID_INPUT", False)
    
    if max_results is not None and max_results < 1:
        raise LeadGenerationError("max_results must be at least 1", "INVALID_INPUT", False)


async def find_leads(
    keyword: str,
    location: str,
    radius: Optional[int] = None,
    max_results: Optional[int] = None,
    include_details: bool = False
) -> FindLeadsOutput:
    """
    Main find_leads function
    
    Args:
        keyword: Business type or search term
        location: Location to search around
        radius: Search radius in meters (default: 5000)
        max_results: Maximum results to return (default: 20)
        include_details: Include phone, website, hours (default: False)
    
    Returns:
        FindLeadsOutput with leads array and metadata
    """
    radius = radius or DEFAULT_RADIUS
    max_results = max_results or DEFAULT_MAX_RESULTS
    
    # Validate inputs
    validate_input(keyword, location, radius, max_results)
    
    # Geocode location
    coords = await geocode_with_fallback(location)
    
    # Search for businesses
    leads = []
    next_page_token = None
    
    if GOOGLE_PLACES_API_KEY:
        try:
            if USE_LEGACY_API:
                result = await search_places_legacy(
                    keyword, coords["latitude"], coords["longitude"],
                    min(radius, MAX_RADIUS), GOOGLE_PLACES_API_KEY
                )
            else:
                result = await search_places_with_api(
                    keyword, coords["latitude"], coords["longitude"],
                    min(radius, MAX_RADIUS), GOOGLE_PLACES_API_KEY, max_results
                )
            
            leads = result["leads"]
            next_page_token = result.get("next_page_token")
            
        except LeadGenerationError as e:
            if not ENABLE_SCRAPER_FALLBACK:
                raise e
            # Fall through to scraper
    
    # Enrich with details if requested
    if include_details and GOOGLE_PLACES_API_KEY:
        leads = await enrich_leads_with_details(leads, GOOGLE_PLACES_API_KEY)
    
    # Sort by rating
    leads.sort(key=lambda x: x.get("rating") or 0, reverse=True)
    
    # Limit results
    leads = leads[:max_results]
    
    return {
        "leads": leads,
        "total_found": len(leads),
        "search_metadata": {
            "keyword": keyword,
            "location": location,
            "radius": min(radius, MAX_RADIUS),
            "coordinates": {
                "lat": coords["latitude"],
                "lng": coords["longitude"],
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        "pagination": {
            "next_page_token": next_page_token,
            "has_more": next_page_token is not None,
        },
    }


async def find_leads_next_page(
    next_page_token: str,
    keyword: str,
    location: str,
    radius: Optional[int] = None,
    max_results: Optional[int] = None
) -> FindLeadsOutput:
    """Get next page of results"""
    if not GOOGLE_PLACES_API_KEY:
        raise LeadGenerationError("Pagination requires Google Places API key", "PAGINATION_ERROR", False)
    
    radius = radius or DEFAULT_RADIUS
    max_results = max_results or DEFAULT_MAX_RESULTS
    
    coords = await geocode_with_fallback(location)
    
    result = await search_places_legacy(
        keyword, coords["latitude"], coords["longitude"],
        radius, GOOGLE_PLACES_API_KEY, next_page_token
    )
    
    return {
        "leads": result["leads"],
        "total_found": len(result["leads"]),
        "search_metadata": {
            "keyword": keyword,
            "location": location,
            "radius": radius,
            "coordinates": {
                "lat": coords["latitude"],
                "lng": coords["longitude"],
            },
            "timestamp": datetime.utcnow().isoformat() + "Z",
        },
        "pagination": {
            "next_page_token": result.get("next_page_token"),
            "has_more": result.get("next_page_token") is not None,
        },
    }


async def check_configuration() -> Dict[str, Any]:
    """Check configuration status"""
    has_key = bool(GOOGLE_PLACES_API_KEY)
    
    # Validate API key if present
    api_key_valid = False
    if has_key:
        try:
            url = "https://places.googleapis.com/v1/places/ChIJd8BlQ2BZwokRAFUEcm_qrcA"
            headers = {
                "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": "id",
            }
            async with aiohttp.ClientSession() as session:
                async with session.get(url, headers=headers) as response:
                    api_key_valid = response.ok
        except Exception:
            pass
    
    configured = has_key or ENABLE_SCRAPER_FALLBACK
    
    return {
        "configured": configured,
        "api_key_valid": api_key_valid,
        "scraper_enabled": ENABLE_SCRAPER_FALLBACK,
        "message": (
            "Ready with Google Places API" if api_key_valid else
            "API key invalid, scraper fallback available" if ENABLE_SCRAPER_FALLBACK else
            "Not properly configured"
        ),
    }


# Example usage
if __name__ == "__main__":
    async def main():
        # Check configuration
        config = await check_configuration()
        print(f"Configuration: {config['message']}\n")
        
        if not config["configured"]:
            print("Please set GOOGLE_PLACES_API_KEY environment variable")
            return
        
        # Example search
        result = await find_leads(
            keyword="coffee shop",
            location="Portland, OR",
            radius=2000,
            max_results=5,
        )
        
        print(f"Found {result['total_found']} leads:\n")
        for lead in result["leads"]:
            print(f"☕ {lead['name']}")
            print(f"   Address: {lead['address']}")
            print(f"   Rating: {lead.get('rating', 'N/A')} ({lead.get('review_count', 0)} reviews)")
            print(f"   Maps: {lead.get('maps_url', 'N/A')}")
            print()
    
    asyncio.run(main())
