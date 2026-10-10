"""Build only public plugin files; never import the app or load its configuration."""
import hashlib
import json
import re
import struct
from pathlib import Path
from urllib.parse import urlsplit
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

SERVICE = Path(__file__).resolve().parents[1]
SOURCE = SERVICE / "chatgpt-plugin"
FILES = ("plugin.json", "mcp.json", "assets/icon.png")
PATTERNS = (
    rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
    rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b",
    rb"\bsk-[A-Za-z0-9_-]{20,}\b",
    rb"\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b",
    rb"mongodb(?:\+srv)?://[^\s\"<>]+",
)
SENSITIVE = re.compile(r"secret|password|passwd|token|credential|private.?key|api.?key|mongodb_uri", re.I)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def https_url(value):
    parsed = urlsplit(value)
    require(parsed.scheme == "https" and parsed.hostname and not parsed.username
            and not parsed.password and not parsed.query and not parsed.fragment,
            "Public URLs must be HTTPS without credentials, query strings or fragments")


def local_sensitive_values():
    # Read values only for comparison; never log any environment contents.
    values = []
    for directory in (SERVICE, SERVICE.parent / "vidorahub-auth"):
        for path in directory.glob(".env*"):
            if not path.is_file():
                continue
            for line in path.read_text(encoding="utf-8-sig").splitlines():
                key, separator, value = line.strip().removeprefix("export ").partition("=")
                if separator and SENSITIVE.search(key):
                    value = value.strip()
                    if value[:1] in ("'", '"'):
                        value = value[1:].split(value[0], 1)[0]
                    else:
                        value = value.split(" #", 1)[0].strip()
                    if len(value) >= 8:
                        values.append(value.encode("utf-8"))
    return values


def validate_json_keys(value):
    if isinstance(value, dict):
        for key, child in value.items():
            require(key.lower() not in {
                "headers", "env", "clientsecret", "client_secret", "access_token",
                "refresh_token", "password", "test_credentials", "reviewer_instructions",
                "apps", "hooks", "command", "args",
            }, "Credentials, local commands, app references and hooks are excluded")
            validate_json_keys(child)
    elif isinstance(value, list):
        for child in value:
            validate_json_keys(child)


def build():
    payloads = {}
    secrets = local_sensitive_values()
    require(not SOURCE.is_symlink(), "Plugin source must not be a symbolic link")
    for name in FILES:
        path = SOURCE / name
        require(not any(p.is_symlink() for p in (path, *path.parents)), "Symbolic links are excluded")
        require(path.resolve().is_relative_to(SOURCE.resolve()), "File escaped the plugin source")
        data = path.read_bytes()
        require(len(data) <= 5 * 1024 * 1024, "Package file exceeds 5 MiB")
        for pattern in PATTERNS:
            require(not re.search(pattern, data), "Credential pattern detected in " + name)
        for secret in secrets:
            require(secret not in data, "Local sensitive value detected in " + name)
        payloads[name] = data

    manifest = json.loads(payloads["plugin.json"])
    config = json.loads(payloads["mcp.json"])
    validate_json_keys(manifest)
    validate_json_keys(config)
    require(manifest.get("$schema") == "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
            "Unexpected plugin schema")
    require(config.get("$schema") == "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
            "Unexpected MCP schema")
    require(manifest["name"] == "vidorahub", "Unexpected plugin name")
    version = manifest["version"]
    require(re.fullmatch(r"\d+\.\d+\.\d+", version), "Expected numeric release version")
    extension = manifest["extensions"]["com.openai"]
    interface = extension["interface"]
    for key, limit in (("displayName", 30), ("shortDescription", 30),
                       ("longDescription", 4000), ("developerName", 80)):
        require(0 < len(interface[key]) <= limit, "Invalid listing field: " + key)
    for key in ("logo", "composerIcon"):
        require(interface[key] == "./assets/icon.png", "Unexpected asset reference")
    for key in ("websiteURL", "privacyPolicyURL", "supportURL", "termsOfServiceURL"):
        if key in interface:
            https_url(interface[key])
    require(set(config["mcpServers"]) == {"vidorahub"}, "Expected exactly one MCP server")
    server = config["mcpServers"]["vidorahub"]
    require(server["type"] == "streamable-http", "Expected remote Streamable HTTP transport")
    https_url(server["url"])
    require(urlsplit(server["url"]).path == "/mcp", "Expected /mcp endpoint")
    auth = server["extensions"]["com.openai"]["auth"]
    require(auth == {"type": "oauth", "client": {"mode": "dcr"}, "baseScopes": ["mcp:access"]},
            "Expected credential-free OAuth DCR configuration")
    cases = extension["review"]["test_cases"]
    require(len(cases["positive"]) == 5 and len(cases["negative"]) == 3,
            "Review requires five positive and three negative cases")
    for case in cases["positive"]:
        require(all(case.get(k) for k in ("description", "prompt", "tools_triggered", "expected_behavior")),
                "Incomplete positive review case")
    for case in cases["negative"]:
        require(all(case.get(k) for k in ("description", "prompt")), "Incomplete negative review case")
    icon = payloads["assets/icon.png"]
    require(icon[:8] == b"\x89PNG\r\n\x1a\n" and icon[12:16] == b"IHDR", "Expected PNG icon")
    width, height = struct.unpack(">II", icon[16:24])
    require(width == height and 48 <= width <= 4096, "Expected square icon, 48 to 4096 pixels")

    output = SERVICE / "plugin-release"
    require(not output.is_symlink(), "Release directory must not be a symbolic link")
    output.mkdir(exist_ok=True)
    archive = output / ("vidorahub-" + version + ".zip")
    require(not archive.is_symlink(), "Archive must not be a symbolic link")
    with ZipFile(archive, "w", compression=ZIP_DEFLATED) as bundle:
        for name, data in payloads.items():
            entry = ZipInfo(name, date_time=(2026, 10, 10, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            bundle.writestr(entry, data)
    with ZipFile(archive) as bundle:
        require(bundle.namelist() == list(FILES), "Unexpected archive entries")
        require(bundle.testzip() is None, "Archive integrity check failed")
        for name, data in payloads.items():
            require(bundle.read(name) == data, "Archive content mismatch")
    print("Built:", archive)
    print("Files:", ", ".join(FILES))
    print("SHA256:", hashlib.sha256(archive.read_bytes()).hexdigest())
    missing = [key for key in ("supportURL", "termsOfServiceURL") if not interface.get(key)]
    if not extension["review"].get("demo_recording_url"):
        missing.append("demo_recording_url")
    print("Required before public review:", ", ".join(missing) or "See CHATGPT_PLUGIN.md for dashboard checks")


if __name__ == "__main__":
    build()
