# CrisisDesk AI — API Reference

Base URL: `http://localhost:5000/api`

Interactive docs (Swagger UI): `http://localhost:5000/docs`

## Response envelope

All successful responses are wrapped:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report submitted successfully",
  "data": {},
  "meta": { "total": 45, "page": 1, "limit": 10, "skip": 0 }
}
```

`meta` is present only on paginated list endpoints.

All error responses are structured:

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Description is required.",
  "errorMessages": ["Description is required."]
}
```

## Report object

```json
{
  "id": "1f0c...uuid",
  "name": "Emon",
  "contact": "017xxxxxxxx",
  "location": "Sylhet Bondor Bazar",
  "description": "There is a fire near a shop and people are trapped.",
  "language": "bn",
  "category": "fire",
  "urgency": "critical",
  "summary": "A fire has been reported near a shop with possible trapped people.",
  "suggestedAction": "Immediately notify fire service and emergency responders.",
  "confidence": 0.91,
  "possibleDuplicate": false,
  "matchedReportId": null,
  "status": "pending",
  "isActive": true,
  "createdAt": "2026-07-12T15:30:00.000Z",
  "updatedAt": "2026-07-12T15:30:00.000Z"
}
```

Enumerations:

- `category`: `medical`, `fire`, `accident`, `crime`, `flood`, `utility`, `public_service`, `infrastructure`, `other`
- `urgency`: `low`, `medium`, `high`, `critical`
- `status`: `pending`, `in_review`, `assigned`, `resolved`, `rejected`
- `language`: `bn`, `en`, `unknown`

---

## POST /api/reports

Submit a new citizen report. Runs Gemini triage + pgvector duplicate detection.

Request body:

```json
{
  "name": "Emon",
  "contact": "017xxxxxxxx",
  "location": "Sylhet Bondor Bazar",
  "description": "There is a fire near a shop and people are trapped.",
  "language": "bn"
}
```

Validation: `description` and `location` are required and non-empty; `contact`
and `name` are optional; `language` must be `bn`, `en`, or `unknown`.

Response `201`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report submitted successfully",
  "data": {
    "id": "1f0c...uuid",
    "category": "fire",
    "urgency": "critical",
    "summary": "A fire has been reported near a shop with possible trapped people.",
    "suggestedAction": "Immediately notify fire service and emergency responders.",
    "confidence": 0.91,
    "possibleDuplicate": false,
    "matchedReportId": null,
    "status": "pending"
  }
}
```

Error `400` (missing fields):

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Description is required.",
  "errorMessages": ["Description is required."]
}
```

---

## GET /api/reports

List reports with filtering and pagination.

Query parameters:

| Param                   | Example              | Notes                                            |
| ----------------------- | -------------------- | ------------------------------------------------ |
| `category`              | `fire`               | Filter by category                               |
| `urgency`               | `critical`           | Filter by urgency                                |
| `status`                | `pending`            | Filter by status                                 |
| `search`                | `shop fire`          | Free-text over description/location/summary/name |
| `startDate` / `endDate` | ISO date             | Created-at date range (use both)                 |
| `page`                  | `1`                  | Page number (default 1)                          |
| `limit`                 | `10`                 | Page size (default 10)                           |
| `sortBy` / `sortOrder`  | `createdAt` / `DESC` | Sorting                                          |

Example: `GET /api/reports?category=fire&urgency=critical`

Response `200`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report fetched successfully",
  "data": [{ "id": "...", "category": "fire", "urgency": "critical", "status": "pending" }],
  "meta": { "total": 7, "page": 1, "limit": 10, "skip": 0 }
}
```

---

## GET /api/reports/:id

Get a single report by id.

Error `404`:

```json
{
  "success": false,
  "statusCode": 404,
  "message": "Report not found.",
  "errorMessages": ["Report not found."]
}
```

---

## PATCH /api/reports/:id/status

Update a report's status. Admin-gated when `AUTH_ENABLED=true`.

Request body:

```json
{ "status": "assigned" }
```

Response `200`: the updated report object.

Errors: `400` for an invalid status value, `404` if the report does not exist,
`401` if `AUTH_ENABLED=true` and no valid admin token is provided.

---

## DELETE /api/reports/:id

Delete a report. Admin-gated when `AUTH_ENABLED=true`.

Response `200`:

```json
{ "success": true, "statusCode": 200, "message": "Report deleted successfully", "data": null }
```

---

## GET /api/reports/stats/summary

Analytics summary across all reports.

Response `200`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Report statistics fetched successfully",
  "data": {
    "totalReports": 45,
    "criticalReports": 7,
    "pendingReports": 18,
    "resolvedReports": 10,
    "categoryBreakdown": {
      "fire": 5,
      "medical": 8,
      "flood": 3,
      "utility": 12,
      "accident": 0,
      "crime": 0,
      "public_service": 0,
      "infrastructure": 0,
      "other": 0
    },
    "urgencyBreakdown": { "low": 9, "medium": 18, "high": 11, "critical": 7 }
  }
}
```

---

## POST /api/auth/login

Admin login. Returns a JWT used for admin-gated endpoints.

Request body:

```json
{ "email": "admin@crisisdesk.ai", "password": "admin123" }
```

Response `200`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": { "accessToken": "eyJhbGci...", "tokenType": "Bearer", "expiresIn": "1d" }
}
```

Use the token on admin endpoints:

```
Authorization: Bearer <accessToken>
```

Error `401`:

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Invalid admin credentials.",
  "errorMessages": ["Invalid admin credentials."]
}
```

---

## AI / duplicate behaviour notes

- Gemini output is validated: unknown categories fall back to `other`, unknown
  urgency to `medium`, and `confidence` is clamped to `[0, 1]`.
- If Gemini is unavailable, submission still succeeds with fallback values
  (`category=other`, `urgency=medium`, `confidence=0`).
- Duplicate detection uses pgvector cosine similarity; a report is flagged when
  similarity to the nearest same-category report is `>= DUPLICATE_SIMILARITY_THRESHOLD`.
