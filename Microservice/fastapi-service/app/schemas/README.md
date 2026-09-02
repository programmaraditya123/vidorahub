# schemas

This folder contains Pydantic models and response helpers used at the API boundary and between layers.

## Files

- `common.py`: Defines `ok(data)`, the standard successful API response wrapper.
- `vibe_job.py`: Defines job request and response shapes.
  - `VibeJobCreate`: request body for creating jobs.
  - `VibeJob`: structured job response model.
  - `VibeJobCreateResult`: job creation result with a duplicate flag.
- `vibe.py`: Defines Vibe request and response shapes.
  - `Vibe`: structured Vibe response model.
  - `VibeUpdate`: editable fields for trimming and presentation.
  - `PublishRequest`: publishing request body.
- `video_source.py`: Defines `SourceDetection`, the normalized result of URL detection.

## Usage

Use schemas for validation and structured data at boundaries. Do not put database queries, provider calls, or long-running logic here.

## Notes

Some response models use `Field(alias="_id")` and `populate_by_name` so MongoDB document ids can be represented cleanly as API fields.
