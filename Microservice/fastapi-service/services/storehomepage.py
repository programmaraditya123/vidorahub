from config.mongo import stores_collections, products_collections


async def get_stores_first_carousel():
    cursor = stores_collections.find(
        {},
        {
            "_id": 1,
            "name": 1,
            "description": 1,
            "category": 1,
            "subCategory": 1,
            "location": 1,
            "websiteurl": 1,
            "ownerId": 1,
        },
    ).sort("review_count", -1).limit(10)

    stores = await cursor.to_list(length=10)

    if not stores:
        return {"stores": []}

    # Keep ObjectIds for querying MongoDB
    owners = [store["ownerId"] for store in stores]

    # Fetch products matching store owners
    cursor = products_collections.find(
        {"creatorId": {"$in": owners}},
        {
            "_id": 0,
            "name": 1,
            "images": 1,
            "creatorId": 1,
        },
    )

    products = await cursor.to_list(length=None)

    print("Owner IDs:", owners)
    print("Matched products:", len(products))

    # Group products by creatorId
    products_by_owner = {}

    for product in products:
        creator_id = product["creatorId"]

        product.pop("creatorId", None)

        products_by_owner.setdefault(creator_id, []).append(product)

    # Attach products to stores
    for store in stores:
        owner_id = store["ownerId"]

        store["products"] = products_by_owner.get(owner_id, [])

        # Convert ObjectIds to strings after matching
        store["_id"] = str(store["_id"])
        store["ownerId"] = str(owner_id)

    return {"stores": stores}