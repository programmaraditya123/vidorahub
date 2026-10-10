"""Isolated packaging checks: no app import, live credentials or network calls."""
import contextlib
import io
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile

import build_chatgpt_plugin as builder


class PluginPackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.service = Path(self.temp.name) / "fastapi-service"
        self.source = self.service / "chatgpt-plugin"
        for name in builder.FILES:
            destination = self.source / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes((builder.SOURCE / name).read_bytes())

    def build(self):
        with patch.object(builder, "SERVICE", self.service), \
                patch.object(builder, "SOURCE", self.source), \
                contextlib.redirect_stdout(io.StringIO()):
            builder.build()

    def edit_manifest(self, transform):
        path = self.source / "plugin.json"
        manifest = json.loads(path.read_bytes())
        transform(manifest)
        path.write_text(json.dumps(manifest), encoding="utf-8")

    def test_archive_excludes_extra_files_and_build_is_reproducible(self):
        (self.source / ".env").write_text("PASSWORD=do-not-package-this", encoding="utf-8")
        (self.source / "private.py").write_text("private source", encoding="utf-8")
        self.build()
        archive = self.service / "plugin-release" / "vidorahub-1.0.0.zip"
        first = archive.read_bytes()
        with ZipFile(archive) as bundle:
            self.assertEqual(bundle.namelist(), list(builder.FILES))
            self.assertIsNone(bundle.testzip())
        self.build()
        self.assertEqual(first, archive.read_bytes())

    def test_local_secret_in_public_description_is_rejected(self):
        secret = "synthetic-sensitive-value-12345"
        (self.service / ".env").write_text("INTROSPECTION_SECRET=" + secret, encoding="utf-8")
        self.edit_manifest(lambda manifest: manifest.update(description=secret))
        with self.assertRaisesRegex(ValueError, "Local sensitive value") as error:
            self.build()
        self.assertNotIn(secret, str(error.exception))
        self.assertFalse((self.service / "plugin-release").exists())

    def test_embedded_credentials_are_rejected(self):
        self.edit_manifest(lambda manifest: manifest.update(clientSecret="synthetic"))
        with self.assertRaisesRegex(ValueError, "Credentials"):
            self.build()

    def test_mongodb_uri_is_rejected_even_without_local_environment(self):
        self.edit_manifest(lambda manifest: manifest.update(description="mongodb+srv://fake:fake@db.invalid/test"))
        with self.assertRaisesRegex(ValueError, "Credential pattern"):
            self.build()

    def test_insecure_remote_url_is_rejected(self):
        path = self.source / "mcp.json"
        config = json.loads(path.read_bytes())
        config["mcpServers"]["vidorahub"]["url"] = "http://localhost/mcp"
        path.write_text(json.dumps(config), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "HTTPS"):
            self.build()


if __name__ == "__main__":
    unittest.main()
