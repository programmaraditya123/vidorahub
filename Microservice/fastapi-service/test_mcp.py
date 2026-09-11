import asyncio
import sys
import unittest
from pathlib import Path
from fastapi.testclient import TestClient
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from main import app

TOOLS = {'search_vidorahub_videos', 'get_trending_vidorahub_videos'}
HEADERS = {'Accept': 'application/json, text/event-stream'}

class MCPTests(unittest.TestCase):
    def test_http_discovery_and_calls(self):
        with TestClient(app, base_url='http://localhost', follow_redirects=False) as client:
            def rpc(method, params=None):
                response = client.post('/mcp', headers=HEADERS, json={
                    'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or {}})
                self.assertEqual(response.status_code, 200, response.text)
                self.assertNotIn('error', response.json())
                return response.json()['result']
            result = rpc('initialize', {'protocolVersion': '2025-03-26', 'capabilities': {},
                                       'clientInfo': {'name': 'test', 'version': '1'}})
            self.assertIn('tools', result['capabilities'])
            notification = client.post('/mcp', headers=HEADERS, json={
                'jsonrpc': '2.0', 'method': 'notifications/initialized'})
            self.assertEqual(notification.status_code, 202)
            tools = rpc('tools/list')['tools']
            self.assertEqual({tool['name'] for tool in tools}, TOOLS)
            for tool in tools:
                self.assertTrue(tool['annotations']['readOnlyHint'])
                result = rpc('tools/call', {'name': tool['name'], 'arguments':
                    {'query': ''} if tool['name'].startswith('search') else {}})
                self.assertFalse(result.get('isError', False))
            self.assertEqual(client.get('/health').json(), {'status': 'ok'})
            self.assertEqual(client.get('/').json()['mcp_endpoint'], '/mcp')
            self.assertEqual(client.post('/mcp/mcp', headers=HEADERS, json={}).status_code, 404)
            rejected = client.post('/mcp', headers={**HEADERS, 'Host': 'untrusted.example'}, json={
                'jsonrpc': '2.0', 'id': 1, 'method': 'tools/list'})
            self.assertEqual(rejected.status_code, 421)

    def test_stdio_discovery_and_call(self):
        async def check():
            params = StdioServerParameters(command=sys.executable,
                args=[str(Path(__file__).with_name('main.py').resolve()), '--transport', 'stdio'])
            async with stdio_client(params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.list_tools()
                    self.assertEqual({tool.name for tool in result.tools}, TOOLS)
                    result = await session.call_tool('get_trending_vidorahub_videos', {})
                    self.assertFalse(result.isError)
        asyncio.run(asyncio.wait_for(check(), timeout=30))

if __name__ == '__main__':
    unittest.main()
