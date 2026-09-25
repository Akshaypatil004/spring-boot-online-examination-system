# Admin API Discovery

Source checked: controllers, DTOs, services, entities, repositories, exception advice, and security configuration in `src/main/java/com/akshay/onlineexam`. Base URL in this project is `http://localhost:8080`. All successful responses use `ApiResponse<T>` (`success: boolean`, `message: String`, `data: T`) except DELETE, which returns an empty `204 No Content` response.

## Backend Context

Admin routes are implemented by `ProgramController`, `SubjectController`, `ExamController`, `QuestionController`, `QuestionManagementController`, `OptionController`, and `AdminResultController`. Request bodies are validated with Jakarta Bean Validation where `@Valid` appears. Services perform additional business checks described below.

## Security / Authorization

- Every `/api/admin/**` route requires an authenticated user with `ROLE_ADMIN`. `SecurityConfig` uses `.hasRole("ADMIN")`; `CustomUserDetailsService` converts the stored role name using Spring's `.roles(...)`, which creates the `ROLE_` authority prefix.
- Authentication uses `Authorization: Bearer <JWT>`. `JwtAuthenticationFilter` validates the token and populates the Spring Security context. Missing, invalid, or expired tokens do not authenticate the request.
- Missing/invalid authentication returns `401` with `{"success":false,"message":"Authentication required","data":null}`. An authenticated non-admin (including a student token) receives `403` with `{"success":false,"message":"Access denied","data":null}`.
- CORS allows origin `http://127.0.0.1:5501`, headers `Authorization`, `Content-Type`, `Accept`, and methods GET, POST, PUT, PATCH, DELETE, OPTIONS.
- CSRF is disabled in the configured filter chain.

## Common HTTP and Error Behavior

- GET and successful PUT/PATCH: `200 OK` with `ApiResponse`.
- POST creates: `201 Created` with `ApiResponse`.
- DELETE success: `204 No Content`, no JSON body.
- Validation failures and `InvalidRequestException`: `400 Bad Request`; body is `ApiResponse<Void>`. Bean validation messages are joined in `message` as `field: message`.
- Missing resources: `404 Not Found`; duplicate program/subject resources: `409 Conflict`; both use `ApiResponse<Void>`.
- Authentication/authorization: `401`/`403` as above.
- The advice does not define a general database/integrity exception handler. Unexpected persistence or server errors may return framework/server error responses (typically 5xx); exact payload is not established here.
- Routes have no query parameters.

## 1. Academic Programs

### Endpoints

| Method and URL | Purpose | Request | Success |
|---|---|---|---|
| `GET /api/admin/programs` | List programs | None | `200 ApiResponse<List<ProgramResponse>>` |
| `GET /api/admin/programs/{id}` | Get one program | `id: Long` path variable | `200 ApiResponse<ProgramResponse>` |
| `POST /api/admin/programs` | Create program | `ProgramRequest` | `201 ApiResponse<ProgramResponse>` |
| `PUT /api/admin/programs/{id}` | Replace editable program fields | `id: Long`, `ProgramRequest` | `200 ApiResponse<ProgramResponse>` |
| `DELETE /api/admin/programs/{id}` | Delete program | `id: Long` | `204`, no body |

Errors: POST may return 400 for validation or 409 when `code` already exists. GET/PUT/DELETE may return 404 for an unknown ID; PUT can return 400/409. Delete has no explicit dependent-record check or cascade in the service; a database FK may prevent deletion if the program is referenced, and that failure is not translated by the shown exception advice.

### DTOs and validation

`ProgramRequest` (POST and PUT):

- `name: String` — `@NotBlank`, max 100 characters.
- `code: String` — `@NotBlank`, max 20 characters; must be unique according to the service.
- `durationYears: Integer` — `@Min(1)`; **no `@NotNull`**, so null passes bean validation even though the entity column is non-null.
- `department: String` — `@NotBlank`, max 100 characters.

`ProgramResponse`: `id: Long` (generated), `name: String`, `code: String`, `durationYears: Integer`, `department: String`, `status: ProgramStatus` (`ACTIVE`, `INACTIVE`). Creation sets status to `ACTIVE`; update does not accept/change status.

## 2. Subjects

### Endpoints

| Method and URL | Purpose | Request | Success |
|---|---|---|---|
| `GET /api/admin/subjects` | List subjects | None | `200 ApiResponse<List<SubjectResponse>>` |
| `GET /api/admin/subjects/{id}` | Get one subject | `id: Long` | `200 ApiResponse<SubjectResponse>` |
| `GET /api/admin/subjects/program/{programId}` | List subjects for program | `programId: Long` | `200 ApiResponse<List<SubjectResponse>>` |
| `POST /api/admin/subjects` | Create subject | `SubjectRequest` | `201 ApiResponse<SubjectResponse>` |
| `PUT /api/admin/subjects/{id}` | Update subject | `id: Long`, `SubjectRequest` | `200 ApiResponse<SubjectResponse>` |
| `DELETE /api/admin/subjects/{id}` | Delete subject | `id: Long` | `204`, no body |

Errors: POST/PUT may return 400 validation, 404 for missing program or subject, and 409 for duplicate subject name within the same program. Program-filtered GET returns 404 when the program does not exist. Delete has no explicit dependent-record guard/cascade; referenced subjects may be protected by database FKs, with exact error behavior not established by the advice.

`SubjectRequest` (POST/PUT): `name: String` (`@NotBlank`, max 100), `description: String` (optional, max 500), `academicProgramId: Long` (`@NotNull`, must reference an existing program).

`SubjectResponse`: `id: Long` (generated), `name: String`, `description: String`, `academicProgramId: Long`, `academicProgramName: String`, `status: SubjectStatus` (`ACTIVE`, `INACTIVE`). Creation sets `ACTIVE`; request does not expose status.

## 3. Exams

### Endpoints

| Method and URL | Purpose | Request | Success |
|---|---|---|---|
| `GET /api/admin/exams` | List exams | None | `200 ApiResponse<List<ExamResponse>>` |
| `GET /api/admin/exams/{id}` | Get one exam | `id: Long` | `200 ApiResponse<ExamResponse>` |
| `GET /api/admin/exams/subject/{subjectId}` | List exams for subject | `subjectId: Long` | `200 ApiResponse<List<ExamResponse>>` |
| `POST /api/admin/exams` | Create exam | `ExamRequest` | `201 ApiResponse<ExamResponse>` |
| `PUT /api/admin/exams/{id}` | Update a draft exam | `id: Long`, `ExamRequest` | `200 ApiResponse<ExamResponse>` |
| `DELETE /api/admin/exams/{id}` | Delete a draft exam | `id: Long` | `204`, no body |
| `PATCH /api/admin/exams/{id}/publish` | Publish a draft | `id: Long`, no body | `200 ApiResponse<ExamResponse>` |
| `PATCH /api/admin/exams/{id}/close` | Close a published exam | `id: Long`, no body | `200 ApiResponse<ExamResponse>` |

Errors: subject-filtered GET may return 404. Create/update may return 400 validation/business rules and 404 for missing subject/exam. Update/delete/publish/close may return 404 for missing exam; lifecycle violations return 400. Delete is allowed only for DRAFT. Database dependencies can still prevent deletion; no explicit cascade is present in the service.

`ExamRequest` (POST/PUT):

- `subjectId: Long` — required (`@NotNull`), must exist.
- `title: String` — `@NotBlank`, max 150.
- `description: String` — optional, max 1000 (entity column allows only 500; values 501–1000 pass DTO validation but may fail persistence).
- `durationMinutes: Integer`, `totalMarks: Integer`, `passingMarks: Integer` — each `@NotNull`, `@Min(1)`; passing marks also cannot exceed total marks.
- `startTime: LocalDateTime` — `@NotNull`, `@Future`.
- `endTime: LocalDateTime` — `@NotNull`; service requires start strictly before end.

JSON date-time fields use Java `LocalDateTime` (no timezone/offset is carried by this type). Send standard ISO local date-time strings such as `2030-05-10T09:30:00`; coordinate timezone interpretation with the backend deployment.

`ExamResponse`: `id: Long` (generated), `subjectId: Long`, `subjectName: String`, `title: String`, `description: String`, `durationMinutes: Integer`, `totalMarks: Integer`, `passingMarks: Integer`, `startTime: LocalDateTime`, `endTime: LocalDateTime`, `status: ExamStatus` (`DRAFT`, `PUBLISHED`, `CLOSED`).

## 4. Questions

### Endpoints

| Method and URL | Purpose | Request | Success |
|---|---|---|---|
| `GET /api/admin/exams/{examId}/questions` | List questions, ordered by `questionOrder` | `examId: Long` | `200 ApiResponse<List<QuestionResponse>>` |
| `POST /api/admin/exams/{examId}/questions` | Create question in exam | `examId: Long`, `QuestionRequest` | `201 ApiResponse<QuestionResponse>` |
| `GET /api/admin/questions/{id}` | Get one question | `id: Long` | `200 ApiResponse<QuestionResponse>` |
| `PUT /api/admin/questions/{id}` | Update question | `id: Long`, `QuestionRequest` | `200 ApiResponse<QuestionResponse>` |
| `DELETE /api/admin/questions/{id}` | Delete question | `id: Long` | `204`, no body |

Errors: 400 validation or closed-exam restriction; 404 for missing exam/question. Create is blocked only when exam status is CLOSED; update/delete are blocked when the question's exam is CLOSED. Published exams are not blocked by these question operations. Deleting a question with options/answers has no explicit service cascade or handling; FK behavior is deployment/database dependent.

`QuestionRequest` (create/update): `questionText: String` (`@NotBlank`, max 2000), `marks: Integer` (`@NotNull`, `@Min(1)`), `questionOrder: Integer` (`@NotNull`, `@Min(1)`). No uniqueness check exists for `questionOrder`; duplicate orders are possible.

`QuestionResponse`: `id: Long` (generated), `examId: Long`, `questionText: String`, `marks: Integer`, `questionOrder: Integer`, `status: String` (service emits `QuestionStatus` name: `ACTIVE`/`INACTIVE`).

## 5. Options

### Endpoints actually exposed

| Method and URL | Purpose | Request | Success |
|---|---|---|---|
| `GET /api/admin/questions/{questionId}/options` | List options for question | `questionId: Long` | `200 ApiResponse<List<OptionResponse>>` |
| `POST /api/admin/questions/{questionId}/options` | Add option | `questionId: Long`, `OptionRequest` | `201 ApiResponse<OptionResponse>` |

The candidate `PUT` and `DELETE` option endpoints do **not** exist in any controller. `OptionServiceImpl` has update/delete methods, but they are not externally callable through the listed Admin API.

Errors: POST may return 400 for validation, more than four existing options, or a closed exam; 404 for missing question. GET returns 404 for missing question.

`OptionRequest`: `optionText: String` (`@NotBlank`, max 500), `optionLabel: String` (`@NotBlank`, max 5), `correct: boolean` (primitive; defaults false if omitted). Service refuses creation after four options exist. It does not require exactly four options, unique labels, or exactly one correct option. Entity column `option_label` length is 1 while DTO permits 5, a likely persistence error for labels longer than one character.

`OptionResponse`: `id: Long` (generated), `optionText: String`, `optionLabel: String`. **It does not return `correct`/`isCorrect`**, so the admin frontend cannot read correctness back through this API. Correctness can be set on create only from the exposed controller routes.

## 6. Results

### Endpoints

| Method and URL | Purpose | Request | Success |
|---|---|---|---|
| `GET /api/admin/results` | List all results | None | `200 ApiResponse<List<ResultResponse>>` |
| `GET /api/admin/results/{resultId}` | Get one result | `resultId: Long` | `200 ApiResponse<ResultResponse>` |
| `GET /api/admin/results/exam/{examId}` | List results for exam | `examId: Long` | `200 ApiResponse<List<ResultResponse>>` |

Single-result GET returns 404 when missing. Exam-filtered service filters existing results and returns an empty list if none match (it does not first verify that the exam exists). `ResultResponse` fields: `resultId: Long`, `attemptId: Long`, `totalQuestions: Integer`, `attemptedQuestions: Integer`, `correctAnswers: Integer`, `wrongAnswers: Integer`, `unansweredQuestions: Integer`, `score: Integer`, `percentage: BigDecimal`, `resultStatus: String` (`PASS`/`FAIL`). No student name/ID, exam title/ID, subject information, attempt status, or timestamps are in the response.

## DTO Reference

| DTO | Exact request/response fields |
|---|---|
| `ProgramRequest` | `name: String`, `code: String`, `durationYears: Integer`, `department: String` |
| `ProgramResponse` | `id: Long`, `name: String`, `code: String`, `durationYears: Integer`, `department: String`, `status: ProgramStatus` |
| `SubjectRequest` | `name: String`, `description: String`, `academicProgramId: Long` |
| `SubjectResponse` | `id: Long`, `name: String`, `description: String`, `academicProgramId: Long`, `academicProgramName: String`, `status: SubjectStatus` |
| `ExamRequest` | `subjectId: Long`, `title: String`, `description: String`, `durationMinutes: Integer`, `totalMarks: Integer`, `passingMarks: Integer`, `startTime: LocalDateTime`, `endTime: LocalDateTime` |
| `ExamResponse` | `id: Long`, `subjectId: Long`, `subjectName: String`, `title: String`, `description: String`, `durationMinutes: Integer`, `totalMarks: Integer`, `passingMarks: Integer`, `startTime: LocalDateTime`, `endTime: LocalDateTime`, `status: ExamStatus` |
| `QuestionRequest` | `questionText: String`, `marks: Integer`, `questionOrder: Integer` |
| `QuestionResponse` | `id: Long`, `examId: Long`, `questionText: String`, `marks: Integer`, `questionOrder: Integer`, `status: String` |
| `OptionRequest` | `optionText: String`, `optionLabel: String`, `correct: boolean` |
| `OptionResponse` | `id: Long`, `optionText: String`, `optionLabel: String` |
| `ResultResponse` | `resultId: Long`, `attemptId: Long`, `totalQuestions: Integer`, `attemptedQuestions: Integer`, `correctAnswers: Integer`, `wrongAnswers: Integer`, `unansweredQuestions: Integer`, `score: Integer`, `percentage: BigDecimal`, `resultStatus: String` |

Request DTO validation and optionality are specified in the resource sections above. Response IDs are generated by the database. `description` fields have no `@NotNull` and can be omitted/null. `OptionRequest.correct` is primitive boolean and defaults to false when omitted. Status fields are response-only for these endpoints.

## Entity Relationships

```text
AcademicProgram 1 ── * Subject 1 ── * Exam 1 ── * Question 1 ── * Option
       │                              │
       └── * Student                  └── * ExamAttempt * ── 1 Student
                                              │
                                              ├── * StudentAnswer
                                              └── 0..1 Result
```

These directions reflect the entity owning-side mappings: Subject references AcademicProgram; Exam references Subject; Question references Exam; Option references Question; Student references AcademicProgram; ExamAttempt references Student and Exam; StudentAnswer references ExamAttempt, Question, and optional selected Option; Result has a unique one-to-one reference to ExamAttempt. CRUD forms therefore need parent IDs: `academicProgramId` to create a subject, `subjectId` to create an exam, `examId` in the question URL, and `questionId` in the option URL. No admin student CRUD endpoint is present in the discovered controllers.

## Exam Lifecycle

- New exams are created with status `DRAFT`.
- `PATCH .../{id}/publish` changes only `DRAFT` to `PUBLISHED`; start time must still be in the future. It does not validate that questions/options exist or that their marks equal exam total marks.
- `PATCH .../{id}/close` changes only `PUBLISHED` to `CLOSED`; it does not check end time.
- Only DRAFT exams can be updated or deleted. Published and closed exams cannot be edited/deleted through these service methods.
- Question/option create/update/delete is prohibited only when the parent exam is CLOSED; it remains allowed for PUBLISHED exams.
- Deleting a non-DRAFT exam returns 400. Deleting a DRAFT exam with dependents has no service-level cascade/guard; database FK behavior is not fully determined by these sources.
- Enum values: `DRAFT`, `PUBLISHED`, `CLOSED`.

## Question/Option Workflow

The actual API supports creating a question before options, then adding options individually. `QuestionServiceImpl` does not require options when creating/updating a question. `OptionServiceImpl` allows up to four options per question but imposes no minimum, unique-label, or exactly-one-correct rule. The `correct` input is a boolean set on option creation. There is no controller endpoint to update/delete options and the response omits correctness, so a client cannot reliably manage or inspect correctness after creation. Publish does not validate question/option completeness. Deleting a question has no explicit cascade or child cleanup in the service; the database may reject it when options/answers reference it.

## Admin Frontend Requirements

- **Programs:** list/detail/create/update/delete via `/api/admin/programs`; forms use `ProgramRequest`; tables show `ProgramResponse`. Handle duplicate code and non-null `durationYears` carefully.
- **Subjects:** list/detail/filter by program/create/update/delete via `/api/admin/subjects`; program list is a dependency for `academicProgramId`; display returned program name/status.
- **Exams:** list/detail/filter by subject/create/update/delete/publish/close via `/api/admin/exams`; subject list is a dependency. Provide lifecycle controls and enforce the draft-only edit/delete behavior in UX, while backend remains authoritative.
- **Questions:** list by exam/create/get/update/delete; exam selection is a dependency. Preserve backend order and permit repeated question order only if intentionally accepted (backend does not reject it).
- **Options:** list and add only via exposed API. The current contract is insufficient for a complete editable options manager because update/delete routes are absent and correctness is not returned. Show this as a backend contract gap rather than inventing routes.
- **Results:** list all/get detail/filter by exam; exam selection is useful for the filter. Results cannot be attributed to students/exams from `ResultResponse`, so an admin table can only display the fields returned unless another verified API is added later.
- **Admin dashboard:** no dedicated admin summary endpoint was found. A dashboard would have to derive any summary from the existing list endpoints; avoid assuming unprovided counts or adding fake data.

## Integration Warnings

1. `ProgramRequest.durationYears` is nullable under bean validation but the database column is non-null.
2. `ExamRequest.description` allows 1000 characters while the entity column allows 500.
3. `OptionRequest.optionLabel` allows 5 characters but the entity column allows 1.
4. Option GET response never includes whether an option is correct; option update/delete controllers do not exist despite service methods.
5. No validation ensures four options, exactly one correct option, unique labels, question-order uniqueness, or completeness before publishing.
6. `ExamResponse` and result responses have different information: exam responses include subject details, but `ResultResponse` includes neither student nor exam/subject details nor timestamps.
7. Date/time fields are `LocalDateTime` with no timezone offset; avoid silently converting UTC/local values.
8. DELETE returns no JSON body. Do not try to parse a success payload.
9. Parent-child delete cascades are not implemented in service code. Existing foreign-key behavior and any schema-level cascade should be checked against the deployed database before relying on deletes.
10. Service/validation exceptions are mapped to 400/404/409, but generic database errors are not mapped by the shown global advice.

## Ambiguities / Not Exposed

- Option update/delete service operations have no controller mapping and are not callable through current REST routes.
- Exact status/payload for FK constraint failures is not specified by `GlobalExceptionHandler`; it depends on persistence/database handling.
- `OptionRequest`/entity label length mismatch and other DTO/entity mismatches may cause persistence errors; exact database response depends on schema and SQL mode.
- No admin student-management endpoint or admin dashboard aggregate endpoint was found among these controllers.
