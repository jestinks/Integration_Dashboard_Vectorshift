# hubspot.py

import json
import secrets
from fastapi import Request, HTTPException
from fastapi.responses import HTMLResponse
import httpx
import asyncio
import base64
import requests
from integrations.integration_item import IntegrationItem

from redis_client import add_key_value_redis, get_value_redis, delete_key_redis

# You'll need to replace these with your credentials
CLIENT_ID = 'XXX'
CLIENT_SECRET = 'XXX'
REDIRECT_URI = 'http://localhost:8000/integrations/hubspot/oauth2callback'

SCOPES = [
    'crm.objects.contacts.read',
    'crm.objects.companies.read',
    'crm.objects.deals.read'
]

encoded_redirect_uri = requests.utils.quote(REDIRECT_URI, safe='')

authorization_url = (
    f'https://app.hubspot.com/oauth/authorize'
    f'?client_id={CLIENT_ID}'
    f'&redirect_uri={encoded_redirect_uri}'
    f'&response_type=code'
    f'&scope={"%20".join(SCOPES)}'
)

async def authorize_hubspot(user_id, org_id):
    state_data = {
        'state': secrets.token_urlsafe(32),
        'user_id': user_id,
        'org_id': org_id
    }
    encoded_state = base64.urlsafe_b64encode(json.dumps(state_data).encode('utf-8')).decode('utf-8')

    await add_key_value_redis(f'hubspot_state:{org_id}:{user_id}', json.dumps(state_data), expire=600)

    auth_url = f'{authorization_url}&state={encoded_state}'
    print(f"Generated auth URL: {auth_url}")
    return auth_url

async def oauth2callback_hubspot(request: Request):
    print("OAuth callback received")
    print(f"Query params: {dict(request.query_params)}")
    
    if request.query_params.get('error'):
        error_msg = request.query_params.get('error')
        print(f"OAuth error: {error_msg}")
        raise HTTPException(status_code=400, detail=error_msg)
    
    code = request.query_params.get('code')
    encoded_state = request.query_params.get('state')
    
    if not code:
        print("No code received in callback")
        raise HTTPException(status_code=400, detail="No authorization code received")
    
    try:
        state_data = json.loads(base64.urlsafe_b64decode(encoded_state).decode('utf-8'))
    except Exception as e:
        print(f"Error decoding state: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid state parameter")

    original_state = state_data.get('state')
    user_id = state_data.get('user_id')
    org_id = state_data.get('org_id')

    saved_state = await get_value_redis(f'hubspot_state:{org_id}:{user_id}')
    print(f"Saved state: {saved_state}")

    if not saved_state or original_state != json.loads(saved_state).get('state'):
        print("State mismatch")
        raise HTTPException(status_code=400, detail='State does not match.')

    print("Exchanging code for token")
    async with httpx.AsyncClient() as client:
        token_response, _ = await asyncio.gather(
            client.post(
                'https://api.hubapi.com/oauth/v1/token',
                data={
                    'grant_type': 'authorization_code',
                    'client_id': CLIENT_ID,
                    'client_secret': CLIENT_SECRET,
                    'redirect_uri': REDIRECT_URI,
                    'code': code
                },
                headers={
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            ),
            delete_key_redis(f'hubspot_state:{org_id}:{user_id}'),
        )

        print(f"Token response status: {token_response.status_code}")
        if token_response.status_code != 200:
            print(f"Token error: {token_response.text}")
            raise HTTPException(status_code=token_response.status_code, detail=token_response.text)
            
        token_data = token_response.json()
        print("Successfully obtained token")

    await add_key_value_redis(f'hubspot_credentials:{org_id}:{user_id}', json.dumps(token_data), expire=600)
    
    close_window_script = """
    <html>
        <script>
            try {
                window.opener.postMessage('oauth_complete', '*');
                console.log('Posted oauth_complete message');
            } catch (e) {
                console.error('Error posting message:', e);
            }
            window.close();
        </script>
    </html>
    """
    return HTMLResponse(content=close_window_script)

async def get_hubspot_credentials(user_id, org_id):
    credentials = await get_value_redis(f'hubspot_credentials:{org_id}:{user_id}')
    if not credentials:
        raise HTTPException(status_code=400, detail='No credentials found.')
    return json.loads(credentials)

async def clear_hubspot_credentials(user_id, org_id):
    """Clear the stored HubSpot credentials for a user"""
    await delete_key_redis(f'hubspot_credentials:{org_id}:{user_id}')

def create_integration_item_metadata_object(response_json: dict, item_type: str) -> IntegrationItem:
    """Creates an integration metadata object from the HubSpot response"""
    integration_item_metadata = IntegrationItem(
        id=str(response_json.get('id')),
        name=response_json.get('properties', {}).get('name') or response_json.get('properties', {}).get('firstname') or response_json.get('properties', {}).get('company'),
        type=item_type,
        creation_time=response_json.get('createdAt'),
        last_modified_time=response_json.get('updatedAt'),
        parent_id=None,
        parent_path_or_name=None
    )
    return integration_item_metadata

async def get_items_hubspot(credentials) -> list[IntegrationItem]:
    """Fetches contacts, companies, and deals from HubSpot"""
    credentials = json.loads(credentials)
    access_token = credentials.get('access_token')
    print(f"Using access token: {access_token[:10]}...")  
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    list_of_integration_item_metadata = []
    
    print("\n=== Fetching Contacts ===")
    contacts_response = requests.get(
        'https://api.hubapi.com/crm/v3/objects/contacts',
        headers=headers
    )
    print(f"Contacts response status: {contacts_response.status_code}")
    if contacts_response.status_code == 200:
        contacts = contacts_response.json().get('results', [])
        print(f"Found {len(contacts)} contacts")
        for contact in contacts:
            contact_item = create_integration_item_metadata_object(contact, 'Contact')
            print(f"Contact: {contact_item.name} (ID: {contact_item.id})")
            list_of_integration_item_metadata.append(contact_item)
    else:
        print(f"Contacts error: {contacts_response.text}")
    
    print("\n=== Fetching Companies ===")
    companies_response = requests.get(
        'https://api.hubapi.com/crm/v3/objects/companies',
        headers=headers
    )
    print(f"Companies response status: {companies_response.status_code}")
    if companies_response.status_code == 200:
        companies = companies_response.json().get('results', [])
        print(f"Found {len(companies)} companies")
        for company in companies:
            company_item = create_integration_item_metadata_object(company, 'Company')
            print(f"Company: {company_item.name} (ID: {company_item.id})")
            list_of_integration_item_metadata.append(company_item)
    else:
        print(f"Companies error: {companies_response.text}")
    
    print("\n=== Fetching Deals ===")
    deals_response = requests.get(
        'https://api.hubapi.com/crm/v3/objects/deals',
        headers=headers
    )
    print(f"Deals response status: {deals_response.status_code}")
    if deals_response.status_code == 200:
        deals = deals_response.json().get('results', [])
        print(f"Found {len(deals)} deals")
        for deal in deals:
            deal_item = create_integration_item_metadata_object(deal, 'Deal')
            print(f"Deal: {deal_item.name} (ID: {deal_item.id})")
            list_of_integration_item_metadata.append(deal_item)
    else:
        print(f"Deals error: {deals_response.text}")
    
    print(f'\n=== Summary ===')
    print(f'Total items found: {len(list_of_integration_item_metadata)}')
    if not list_of_integration_item_metadata:
        print("Warning: No data was found in any of the HubSpot endpoints")
    return list_of_integration_item_metadata 