# VidoraHub ChatGPT plugin

This package connects ChatGPT to the existing hosted FastAPI MCP service. Uploading
the ZIP does not deploy the Python server or make the listing public automatically.
OAuth stays enabled: public distribution means anyone eligible can install the
plugin and connect their own VidoraHub account.

## Build

From `Microservice/fastapi-service`, run:

```powershell
python scripts/build_chatgpt_plugin.py
```

Output: `plugin-release/vidorahub-1.0.0.zip`, with `plugin.json`, `mcp.json`, and
`assets/icon.png` at the archive root. The icon is the user-supplied purple play
artwork, converted to PNG at its original 1024 by 1024 pixels. It meets the square
icon requirement (48 to 4096 pixels) and the 5 MiB file-size limit.
The builder uses an explicit file allowlist, rejects symbolic links, checks
configuration and review-case counts, scans for credential patterns and sensitive
values from local environment files without printing them, and verifies the final
archive. It never imports the application or connects to MongoDB.

Only public connection metadata and the icon ship. Python source, `.env`, virtual
environments, logs, user records, tokens and reviewer credentials are excluded.
Pattern matching is a packaging safeguard, not a guarantee against every possible
secret format; review changes to the three allowlisted files before distribution.

## Complete public review information

The checked-in manifest is an uploadable draft. These items remain before submission:

1. Confirm the production MCP URL in `chatgpt-plugin/mcp.json` matches the deployed
   `MCP_RESOURCE`. The configured URL comes from `config/mongo.py` and the service README.
2. Confirm the website and privacy URLs are publicly accessible and identify the
   verified publisher. The privacy URL is taken from the frontend's settings page.
3. Supply real support and terms-of-service URLs in the dashboard, or add `supportURL`
   and `termsOfServiceURL` under `extensions.com.openai.interface`, then rebuild.
   These fields are deliberately omitted rather than populated with invented URLs.
4. Record a walkthrough covering every tool, including account connection and an
   owned sample video's title change. Add its accessible URL in the dashboard or
   as `extensions.com.openai.review.demo_recording_url`, then rebuild.
5. Prepare a dedicated reviewer account with sample uploads. Enter its credentials
   and sign-in instructions only in the secure dashboard Review details form.
6. Run all five positive and three negative cases from the manifest against the
   deployed service. These are proposed review scenarios, not recorded passing tests.
7. Choose the listing category and supported countries in the dashboard. Country
   targeting is intentionally omitted; the package does not assert a global rollout.
8. Confirm commerce disclosures: the plugin discovers catalog products and stores,
   but does not order products or process payments.

## Server findings to resolve before public review

The ZIP declares a connection; tools and permissions come from the deployed server.
Repository inspection found two issues in the existing title-update implementation:

- `mcptools/creators.py` marks `update_creator_user_video_title` with
  `readOnlyHint=True` despite modifying a video. Set it to false and use annotations
  that accurately describe the operation before deploying and scanning for review.
- `services/creator/creatorvideos.py:update_title` calls `validate.get(...)` before
  checking whether the ownership lookup returned a record. An unavailable or unowned
  video can therefore fail with an exception. Handle missing records before accessing
  them and test rejection without a write. Repeated updates also maintain history,
  so check the accuracy of the advertised idempotency hint.

These backend changes are outside the ZIP packaging work and have not been applied.
Do not submit the write capability until its ownership, error handling and metadata
have been verified in production. No real user data or write calls are needed to
build this archive.

## Connect and publish

1. Deploy and test both the MCP service and its OAuth issuer. Keep database URLs,
   JWT keys and introspection secrets only in the server's secret configuration.
   Verify public protected-resource discovery, OAuth discovery, DCR, PKCE login,
   and authenticated MCP initialization and tool discovery.
2. For a personal test, open ChatGPT Plugins, choose Add custom MCP server, enter
   the HTTPS `/mcp` URL from `mcp.json`, and select OAuth with dynamic registration.
   Install it and test the tools in a new conversation.
3. For public distribution, open Plugins and choose Upload new or existing plugin
   in the submission portal. Select the verified developer identity and upload
   `plugin-release/vidorahub-1.0.0.zip`. If the portal offers separate paths, choose
   **With MCP**; the Skills only path rejects MCP configuration.
4. Under MCPs, connect the server, complete the domain-verification challenge and
   OAuth flow, and run its tool scan. Resolve the automated findings.
5. Complete the missing listing and review information above, submit for review,
   and choose Publish plugin after approval. Workspace sharing alone does not
   publish the plugin to the public directory.

To update package metadata or icons, change the manifest version and rebuild the
complete ZIP. Hosted tool changes are deployed to the server and rescanned separately.

## Official documentation consulted

Consulted on 2026-10-10:

- [Package your plugin](https://developers.openai.com/plugins/build/plugins)
- [Upload and submit your plugin](https://developers.openai.com/plugins/deploy/submission)
- [Submission errors and required materials](https://developers.openai.com/plugins/deploy/submission-errors)
- [Plugin guidelines](https://developers.openai.com/plugins/plugin-guidelines)

The package uses the documented portable Agent Plugins format with the OpenAI
extension. It includes no registered app references, lifecycle hooks or bundled skills.
