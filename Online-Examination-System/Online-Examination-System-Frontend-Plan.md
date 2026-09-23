# Online Examination System — Frontend Completion Plan

## 1. Final Frontend Decision

The Spring Boot backend is already implemented, tested, and pushed to GitHub.

For the first complete working version, use:

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript
- Bootstrap Icons where useful
- SweetAlert2 only if genuinely useful
- Chart.js only if a real chart requirement appears

Angular is deferred, not cancelled. The same Spring Boot REST API can later be consumed by Angular.

**Do not install Node.js, npm, Angular CLI, React, Tailwind, or another frontend framework for this version.**

Goal: finish a complete, working, professional college project quickly while keeping the code understandable.

---

## 2. Existing Backend — Source of Truth

Stack:
- Java 17
- Spring Boot 4.1.1
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- MySQL
- Maven
- REST APIs

Backend:
`http://localhost:8080`

Database:
`online_exam_db`

Do not redesign or rewrite the backend during frontend work unless a real integration problem requires it.

---

## 3. Architecture

```text
Browser
   |
   | HTML + Bootstrap + JavaScript
   | HTTP / JSON + JWT
   v
Spring Boot REST API
   |
   v
MySQL
```

Development:
- Frontend: `http://localhost:5500`
- Backend: `http://localhost:8080`

These are different origins, so configure CORS in Spring Security if required. Do not disable security globally.

---

## 4. Confirmed Student APIs

```http
POST /api/auth/register
POST /api/auth/login

GET /api/students/me

GET /api/student/exams/available
POST /api/student/exams/{examId}/attempts
GET /api/student/exams/{attemptId}/questions

PUT /api/student/attempts/{attemptId}/answers/{questionId}

POST /api/student/exams/{attemptId}/submit

GET /api/student/attempts

GET /api/student/results
GET /api/student/results/{resultId}
```

Answer body:

```json
{
  "optionId": 1
}
```

Important: there is **no** `/api/student/results/me`.

For admin APIs, inspect the actual backend controllers and DTOs before implementing. Never invent mappings.

---

## 5. Backend Business Rules

Frontend must respect these rules:

- MCQ examination
- Four options per question
- One correct answer
- No negative marking
- One attempt per student per exam
- Fixed duration
- Auto-submit on timeout
- Backend is authoritative
- Correct answers are never exposed to students
- Student identity comes from JWT
- Answers cannot be changed after submission
- Duplicate submission is blocked
- Result is persisted
- Students only access permitted resources

Frontend validation is for UX; backend validation/security remains authoritative.

---

## 6. Target Frontend Structure

```text
Online-Examination-System/
|
├── src/                         # Spring Boot backend
├── pom.xml
|
├── frontend/
│   ├── index.html
│   ├── css/
│   │   ├── style.css
│   │   └── theme.css
│   ├── js/
│   │   ├── api.js
│   │   ├── auth.js
│   │   ├── common.js
│   │   ├── student.js
│   │   ├── exam.js
│   │   ├── result.js
│   │   └── admin.js
│   ├── student/
│   │   ├── dashboard.html
│   │   ├── exams.html
│   │   ├── exam.html
│   │   ├── results.html
│   │   └── profile.html
│   ├── admin/
│   │   ├── dashboard.html
│   │   ├── programs.html
│   │   ├── subjects.html
│   │   ├── exams.html
│   │   ├── questions.html
│   │   └── students.html
│   └── assets/
|
└── ...
```

Adjust this if a simpler structure is technically better. Do not create unnecessary files.

---

## 7. UI Direction

The UI must be:

- Simple
- Professional
- Clean
- Modern
- Responsive
- College-project appropriate
- Light theme by default
- Light/dark theme toggle

Avoid:

- Glassmorphism everywhere
- Huge gradients
- Neon colors
- Excessive animations
- Excessive rounded cards
- Giant dashboard cards
- AI/SaaS-looking visual style
- Unnecessary decorative components
- Over-engineering

Use Bootstrap 5 for layout/components and Bootstrap Icons where useful.

Do not add large UI frameworks without a real requirement.

---

## 8. Authentication

Login:

```text
Login page
   ↓
POST /api/auth/login
   ↓
JWT + role
   ↓
sessionStorage
   ↓
role-specific dashboard
```

Use `sessionStorage` for this college/demo project.

Store only what is needed, such as:
- accessToken
- role

Every protected request sends:

```http
Authorization: Bearer <JWT>
```

Handle:
- missing token
- invalid/expired token
- 401
- 403
- logout
- redirect to login

Do not implement refresh tokens for V1.

---

## 9. Student Features

### Dashboard
Show:
- Student name
- Roll number
- Program
- Year/semester
- Available exams
- Completed attempts
- Recent results

### Available Exams
Show actual API data:
- title
- subject
- duration
- marks
- passing marks
- availability/status when provided
- Start button

### Exam
Flow:

```text
Available Exam
↓
Start Attempt
↓
Load Questions
↓
Select answers
↓
Save answers
↓
Timer
↓
Submit
↓
Result
```

### Timer
The frontend timer is UX only. Backend remains authoritative.

At zero:
- submit automatically
- prevent duplicate submission
- handle already-submitted response
- navigate to result

### Results
Show:
- score
- percentage
- pass/fail
- total questions
- attempted
- correct
- wrong
- unanswered
- generated time if available

### Profile
Use:

```http
GET /api/students/me
```

### Attempts
Use:

```http
GET /api/student/attempts
```

---

## 10. Admin Features

Implement after the complete student workflow works.

Before coding admin screens:
1. Inspect actual admin controllers.
2. Inspect DTOs.
3. Confirm endpoint mappings.
4. Confirm HTTP methods.
5. Confirm request/response fields.
6. Confirm authorization.

Potential modules:
- Dashboard
- Programs
- Subjects
- Exams
- Questions/options
- Students
- Results

Never guess admin endpoints.

---

## 11. JavaScript Organization

### api.js
- base URL
- GET/POST/PUT/DELETE helpers as needed
- JSON handling
- Authorization header
- common HTTP error handling

### auth.js
- login
- logout
- token storage/retrieval
- role retrieval
- session handling

### common.js
- navbar
- theme toggle
- shared UI helpers
- formatting

### student.js
- dashboard/profile/exam list behavior

### exam.js
- start attempt
- questions
- selected answers
- answer saving
- timer
- submit

### result.js
- result list/detail

### admin.js
- admin-specific behavior

Avoid one giant JavaScript file.

---

## 12. Error Handling

Handle at least:

```text
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
500 Server Error
```

Show user-friendly messages, not Java/Spring stack traces.

Example:

`Unable to load exams. Please try again.`

Authentication example:

`Your session has expired. Please login again.`

---

## 13. CORS

Development origins:

```text
Frontend: http://localhost:5500
Backend:  http://localhost:8080
```

If browser requests fail due to CORS, configure the backend correctly.

Do NOT:
- disable Spring Security
- make every origin permanently allowed without understanding why
- remove JWT security

Allow the local frontend development origin.

---

## 14. Development Method

Use short milestones:

```text
Implement
   ↓
Run
   ↓
Test
   ↓
Fix
   ↓
Verify
   ↓
Git checkpoint
   ↓
Next milestone
```

Never ask the coding agent to build the whole frontend in one giant operation.

If the agent stops halfway:

```text
Inspect current state.
Do not recreate completed work.
Continue the current milestone.
Finish missing work.
Run validation.
```

---

## 15. Git Checkpoints

Suggested commits:

```text
feat: initialize frontend foundation
feat: implement authentication flow
feat: implement student dashboard
feat: implement student exam flow
feat: implement student results
feat: implement admin dashboard
feat: implement admin management modules
style: polish frontend ui and theme
test: complete frontend integration testing
```

Before a checkpoint:

```bash
git status
git diff
git add .
git commit -m "..."
git push
```

Do not commit every tiny change.

---

# 16. CODING AGENT PROMPTS

## Prompt 1 — Initial Frontend Foundation

Read `FRONTEND-COMPLETION-PLAN.md` before making changes.

We are building the frontend for an existing Spring Boot REST backend.

Implement ONLY the frontend foundation milestone.

Requirements:
- Use plain HTML5, CSS3, Bootstrap 5, and vanilla JavaScript.
- Do not use Angular, React, Vue, Tailwind, TypeScript, npm, or a frontend framework.
- Do not modify the Spring Boot backend unless a real CORS issue must be addressed.
- Create a `frontend` directory inside the existing repository.
- Create a clean, maintainable initial folder structure.
- Add Bootstrap 5 through CDN.
- Add Bootstrap Icons through CDN if useful.
- Create the initial `index.html`.
- Create shared CSS/JS structure.
- Create a professional light-theme base layout.
- Include a working light/dark theme toggle.
- Create a reusable navbar/footer structure.
- Do not implement login, student dashboard, exam flow, or admin features yet.
- Do not add unnecessary libraries.

Before changes:
1. Inspect the repository.
2. Confirm the Spring Boot backend remains untouched.
3. Inspect `.gitignore`.

After implementation:
1. Verify created HTML/CSS/JS files.
2. Serve the frontend locally if possible.
3. Check browser console errors.
4. Verify theme toggle.
5. Summarize changes.
6. Stop after this milestone.

---

## Prompt 2 — Authentication

Read `FRONTEND-COMPLETION-PLAN.md`.

Continue from the existing frontend foundation.

Implement ONLY authentication.

Use the actual backend endpoint:

`POST /api/auth/login`

Inspect the backend AuthController and login DTO/response before implementation.

Requirements:
- Login page
- Email/password form
- Client validation
- API call
- JWT in sessionStorage
- Role storage
- Student/admin redirect
- Logout
- Protected-page behavior
- 401/403 handling
- Invalid/expired session handling
- Reusable auth helper
- Reusable API helper for Authorization header

Do not implement exam/admin management yet.

Do not invent API fields.

Test against the real Spring Boot backend.

---

## Prompt 3 — Student Dashboard/Profile

Implement student dashboard and profile using:

`GET /api/students/me`

Do not use mock student data.

Display useful student information and dashboard summary.

Keep UI simple and professional.

Verify authenticated and unauthenticated behavior.

---

## Prompt 4 — Available Exams

Implement:

`GET /api/student/exams/available`

Display actual API response.

Implement loading, empty, error, and success states.

Add Start Exam button.

Do not invent response fields.

---

## Prompt 5 — Exam Attempt

Implement:

`POST /api/student/exams/{examId}/attempts`

`GET /api/student/exams/{attemptId}/questions`

Build the exam interface.

Display questions/options.

Never expose correct answers.

---

## Prompt 6 — Answer Saving

Implement:

`PUT /api/student/attempts/{attemptId}/answers/{questionId}`

Save selected answers.

Allow changing answers before submission.

Handle API errors.

Do not allow changes after submission.

---

## Prompt 7 — Timer and Submission

Implement:

`POST /api/student/exams/{attemptId}/submit`

Requirements:
- countdown timer
- warning near timeout
- automatic submit at zero
- manual submit
- confirmation before manual submit
- prevent duplicate requests
- handle already-submitted response
- navigate to result after success

Backend remains authoritative.

---

## Prompt 8 — Results

Implement:

`GET /api/student/results`

`GET /api/student/results/{resultId}`

Display:
- score
- percentage
- pass/fail
- total questions
- attempted
- correct
- wrong
- unanswered

Implement result history and detail.

---

## Prompt 9 — Attempts

Implement:

`GET /api/student/attempts`

Display previous attempts where useful.

---

## Prompt 10 — Admin API Discovery

Before coding admin UI, inspect all actual admin controllers and DTOs.

Create a documented list of:
- endpoint
- HTTP method
- request body
- response
- purpose
- authorization

Do not implement UI yet.

---

## Prompt 11+ — Admin Modules

After Prompt 10 confirms actual mappings, implement one module at a time:

1. Admin dashboard
2. Programs
3. Subjects
4. Exams
5. Questions/options
6. Students
7. Results

Use actual backend APIs only.

---

## Final UI Polish

After all functionality works:
- improve spacing
- typography
- responsiveness
- buttons
- forms
- tables
- alerts
- loading indicators
- empty states
- dark mode
- remove duplicate CSS/JS
- remove unused files
- remove debug console logs
- check browser console
- check all navigation
- test desktop/mobile widths

Do not redesign working functionality unnecessarily.

---

# 17. Definition of Done

Authentication:
- login works
- JWT stored
- protected requests send JWT
- logout works
- unauthorized users redirected
- role navigation works

Student:
- dashboard
- profile
- available exams
- start attempt
- questions
- save/change answers
- timer
- auto-submit
- manual submit
- duplicate-submit handling
- results
- result history

Admin:
- dashboard
- actual management APIs
- forms validate
- success/error messages
- student/admin authorization behavior

UI:
- responsive
- light theme
- dark theme toggle
- navigation works
- loading states
- empty states
- errors handled
- no broken links
- no application-caused console errors

Final test:
- student login
- admin login
- invalid login
- invalid/expired token
- available exam
- start exam
- answer questions
- change answer
- submit
- timeout
- duplicate submit
- results
- logout

---

# 18. Final Demo Flow

## Student

```text
Open frontend
↓
Login
↓
Dashboard
↓
Available Exams
↓
Start Java exam
↓
Questions
↓
Answer questions
↓
Change answer
↓
Submit
↓
Result
↓
My Results
↓
Profile
↓
Logout
```

## Admin

```text
Login as admin
↓
Dashboard
↓
Programs
↓
Subjects
↓
Exams
↓
Questions
↓
Students
↓
Results
↓
Logout
```

---

# 19. Final Principle

The objective is not to create the most technologically complicated frontend.

The objective is:

> A complete, working, understandable, professional Online Examination System using the already-tested Spring Boot REST backend.

Keep it simple.
Use real APIs.
Validate continuously.
Commit stable milestones.
Do not over-engineer.
