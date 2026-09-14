"""Product HTTP contract tests with a mocked MongoDB boundary."""
import importlib
import sys
import unittest
from types import ModuleType
from unittest.mock import AsyncMock, MagicMock, patch

from bson import ObjectId
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pymongo.errors import ExecutionTimeout


class ProductSearchTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        mongo = ModuleType("config.mongo")
        mongo.products_collections = MagicMock()
        with patch.dict(sys.modules, {"config.mongo": mongo}):
            cls.service = importlib.import_module("services.storeproducts.products")
            cls.routes = importlib.import_module("routes.products")
        app = FastAPI()
        app.include_router(cls.routes.router)
        cls.client = TestClient(app)

    def setUp(self):
        self.collection = MagicMock()
        self.collection.aggregate.return_value.to_list = AsyncMock(return_value=[])
        patcher = patch.object(self.service, "products_collections", self.collection)
        patcher.start()
        self.addCleanup(patcher.stop)

    def pipeline(self):
        return self.collection.aggregate.call_args.args[0]

    def test_defaults(self):
        response = self.client.get("/api/products/find")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {
            "platform": "vidorahub", "count": 0, "products": [],
            "page": 1, "limit": 20, "hasMore": False, "nextPage": None,
        })
        self.assertEqual(self.pipeline()[0], {"$match": {"status": "active"}})
        self.assertEqual(self.pipeline()[1], {"$sort": {"createdAt": -1, "_id": -1}})

    def test_combined_filters_and_sort(self):
        for sort, direction in (("price_asc", 1), ("price_desc", -1)):
            with self.subTest(sort=sort):
                response = self.client.get("/api/products/find", params={
                    "query": "  a.*  ", "minPrice": 0, "maxPrice": 100,
                    "rating": 4, "sort": sort, "page": 2, "limit": 10,
                })
                self.assertEqual(response.status_code, 200)
                pipeline = self.pipeline()
                filters = pipeline[0]["$match"]
                self.assertEqual(filters["status"], "active")
                self.assertEqual(filters["price"], {"$gte": 0, "$lte": 100})
                self.assertEqual(filters["rating.average"], {"$gte": 4, "$lte": 5})
                self.assertEqual(filters["$or"][0]["name"]["$regex"], r"a\.\*")
                self.assertEqual(pipeline[1]["$sort"]["price"], direction)
                self.assertEqual(pipeline[2], {"$skip": 10})
                self.assertEqual(pipeline[3], {"$limit": 11})

    def test_independent_optional_filters(self):
        for params in ({"minPrice": 0}, {"maxPrice": 50}, {"rating": 1},
                       {"rating": 5}, {"query": "   "}):
            with self.subTest(params=params):
                self.assertEqual(self.client.get("/api/products/find", params=params).status_code, 200)
        self.assertEqual(self.pipeline()[0], {"$match": {"status": "active"}})

    def test_invalid_parameters_never_query_database(self):
        for params in (
            {"minPrice": -1}, {"maxPrice": -1}, {"minPrice": 20, "maxPrice": 10},
            {"rating": 0}, {"rating": 6}, {"rating": "nan"},
            {"minPrice": "inf"}, {"maxPrice": "nan"}, {"minPrice": "abc"},
            {"sort": "invalid"}, {"page": 0}, {"page": 10001},
            {"limit": 0}, {"limit": 101}, {"query": "x" * 201},
        ):
            with self.subTest(params=params):
                self.assertEqual(self.client.get("/api/products/find", params=params).status_code, 422)
        self.collection.aggregate.assert_not_called()

    def test_profiles_serialization_and_pagination(self):
        product_id, creator_id = ObjectId(), ObjectId()
        self.collection.aggregate.return_value.to_list.return_value = [
            {"_id": product_id, "creatorId": {"_id": creator_id, "name": "Creator"}},
            {"_id": ObjectId(), "creatorId": None},
            {"_id": ObjectId(), "creatorId": None},
        ]
        response = self.client.get("/api/products/find?limit=2").json()
        self.assertEqual(response["count"], 2)
        self.assertTrue(response["hasMore"])
        self.assertEqual(response["nextPage"], 2)
        self.assertEqual(response["products"][0]["_id"], str(product_id))
        self.assertEqual(response["products"][0]["creatorId"]["_id"], str(creator_id))
        self.assertIsNone(response["products"][1]["creatorId"])
        lookup = self.pipeline()[4]["$lookup"]
        self.assertEqual(lookup["from"], "userprofiles")
        self.assertEqual(set(lookup["pipeline"][0]["$project"]), {"_id", "name", "username", "avatar"})

    def test_database_failure_is_sanitized(self):
        self.collection.aggregate.side_effect = ExecutionTimeout("private database details")
        with self.assertLogs(self.routes.logger, level="ERROR"):
            response = self.client.get("/api/products/find")
        self.assertEqual(response.status_code, 503)
        self.assertNotIn("private", response.text)


if __name__ == "__main__":
    unittest.main()
