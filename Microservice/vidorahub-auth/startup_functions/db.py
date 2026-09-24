from config.mongo import oauth_clients_collection

async def create_default_oauth_client():

    existing = await oauth_clients_collection.find_one({
        "client_id": "buddy-ai"
    })

    if existing:
        return

    await oauth_clients_collection.insert_one({
        "client_id": "buddy-ai",
        "client_name": "Buddy AI",
        "redirect_uris": [
            "http://localhost:3000/oauth/callback"
        ],
        "grant_types": [
            "authorization_code",
            "refresh_token"
        ],
        "token_endpoint_auth_method": "none",
    })