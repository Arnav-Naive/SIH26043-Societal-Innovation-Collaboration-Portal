A full-stack Societal Innovation Collaboration Portal developed for
Smart India Hackathon Problem Statement 26043.

The platform connects citizens who identify local societal problems with
government, higher education institutions, faculty mentors, and
industry/CSR partners. The goal is to move a problem through a
structured pipeline from problem identification to research,
innovation, implementation, and measurable impact.

This is not a grievance-redressal application. It is a
problem-to-innovation collaboration pipeline.

Project Overview

Many societal problems are reported locally but remain fragmented across
different stakeholders. Citizens may identify problems, universities may
have relevant expertise, and industry or CSR organizations may have
resources, but these capabilities are often not connected through a
common workflow.

The platform provides a centralized workflow:

Citizen
   ↓
Societal Problem Submission
   ↓
Categorization
   ↓
Government Review
   ↓
University Routing
   ↓
Project Team Formation
   ↓
Faculty Mentoring
   ↓
Industry / CSR Support
   ↓
Project Milestones
   ↓
Implementation
   ↓
Completion & Impact Tracking

Core Objectives

Capture real societal problems from citizens.

Organize problems by category and district.

Allow government administrators to review and route challenges.

Connect challenges with suitable universities.

Enable HEI SPOCs to form project teams.

Enable faculty mentors to guide projects.

Allow industry and CSR partners to provide mentorship, funding, or
pilot support.

Track project milestones from proposal to completion.

Provide government-level analytics and oversight.

Maintain institutional knowledge through structured records and audit
logs.

User Roles

Role

Responsibility

citizen

Submit and track societal challenges

hei_spoc

Manage assigned challenges and form project teams

faculty_mentor

Guide project teams and approve milestones

industry_partner

Browse projects and offer mentorship, funding, or pilot support

gov_admin

Full application-level administration, routing, analytics and master-data control

Government Admin

The gov_admin role is the central administrative layer.

Admin can manage:

Challenges

Districts

Categories

Category keywords

Universities

Industry partners

Users

Project teams

Partnerships

Milestones

Master data

Audit logs

Analytics

Critical data-integrity rules should still prevent unsafe deletion of
records referenced elsewhere.

Main Features

1. Citizen Challenge Submission

Citizens can submit local problems related to:

Education

Healthcare

Agriculture

Water

Sanitation

Environment

Rural livelihoods

Accessibility

Urban infrastructure

Public administration

Challenge information includes:

Title

Description

Category

District

Location

Priority

Supporting media

Submission information

Current status

Citizens can track submitted challenges.

2. Explainable Challenge Categorization

The MVP intentionally does not use an ML or embedding model.

It uses an explainable keyword-matching mechanism.

Example:

Problem:
"Every monsoon the market gets flooded and water remains on the road."

Matched keywords:
water, flood, flooded

Suggested category:
Water

Confidence:
Calculated from keyword matches

The system can provide a classification reason. Government Admin can
manually correct the suggested category.

3. Government Review and Routing

Government administrators can:

View all challenges

Search and filter challenges

Review submissions

Change priority

Correct categorization

Route challenges to universities

Re-route challenges

Update challenge status

Monitor project progress

View lifecycle history

Challenge status:

Submitted
    ↓
Under Review
    ↓
Routed
    ↓
In Progress
    ↓
Completed

4. University Collaboration

Universities maintain:

University profile

District

Expertise areas

Assigned challenges

An HEI SPOC can form a project team for an assigned challenge.

A project team contains:

Challenge

University

Faculty mentor

Student members

Team status

Team status:

Formed
Proposal Submitted
Approved

5. Faculty Mentoring

Faculty mentors guide project teams through the project lifecycle,
including project proposals, milestones, evidence, progress and
approvals.

6. Industry / CSR Collaboration

Industry partners can browse projects needing support and offer:

Mentorship

Funding

Pilot support

Funding is represented as application data/text in the MVP. No payment
gateway is included.

Partnership status:

Proposed
Active
Completed

7. Project Milestones

Each milestone contains:

Title

Description

Due date

Status

Evidence file

Milestone status:

Pending
Submitted
Approved

Government Admin or Faculty Mentor can approve milestones according to
the defined permissions.

8. Analytics

Government Admin receives an overview of ecosystem activity.

Analytics include:

Total challenges

Challenges by category

Challenges by district

Challenges by status

Teams formed

Active partnerships

The MVP uses Recharts bar charts and district-wise tables. Complex maps
are excluded.

9. Master Data Control

Government Admin can manage configurable data such as:

Districts

Categories

Category descriptions

Category keywords

Active/inactive status

Districts and categories should be loaded from backend data rather than
permanently hardcoded in the frontend.

10. Audit Logs

Important administrative actions are recorded with:

User

Action

Module

Object/record ID

Previous value where applicable

New value where applicable

Timestamp

Examples:

ADMIN CREATED UNIVERSITY
ADMIN UPDATED CHALLENGE
ADMIN ROUTED CHALLENGE
ADMIN CHANGED USER ROLE
ADMIN DEACTIVATED DISTRICT
ADMIN UPDATED CATEGORY

Audit history is read-only.

Technology Stack

Backend

Django 5

Django REST Framework

SQLite for development/demo

djangorestframework-simplejwt

Custom Django User model

Django local media storage

Models and migrations should remain clean so SQLite can later be
replaced with PostgreSQL.

Frontend

React

Vite

Tailwind CSS

React Context or Zustand

Recharts

No Redux is required for the MVP.

Project Structure

SIH26043-Societal-Innovation-Collaboration-Portal/
│
├── backend/
│   ├── manage.py
│   ├── config/
│   ├── accounts/
│   ├── challenges/
│   ├── universities/
│   ├── industry/
│   ├── projects/
│   ├── analytics/
│   ├── media/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── store/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md

Backend Setup

1. Clone the repository

git clone <YOUR_REPOSITORY_URL>
cd SIH26043-Societal-Innovation-Collaboration-Portal

2. Create a virtual environment

Windows:

python -m venv venv
venv\Scripts\activate

Linux/macOS:

python3 -m venv venv
source venv/bin/activate

3. Install dependencies

cd backend
pip install -r requirements.txt

4. Run migrations

python manage.py makemigrations
python manage.py migrate

5. Create a superuser if required

python manage.py createsuperuser

6. Seed demo data

If the project provides the seed command:

python manage.py seed_data

The demo dataset should contain approximately:

5–6 sample challenges

3 sample universities

2 sample industry partners

Sample users for supported roles

7. Start backend

python manage.py runserver

Backend:

http://127.0.0.1:8000/

Frontend Setup

Open a new terminal:

cd frontend
npm install
npm run dev

Frontend:

http://localhost:5173/

Authentication

The application uses JWT authentication.

Login
  ↓
Access Token
  ↓
Authenticated API Requests
  ↓
Refresh Token when required

API requests use:

Authorization: Bearer <ACCESS_TOKEN>

Role-based access must be enforced on the backend.

Main API Endpoints

Authentication

POST /api/auth/register/
POST /api/auth/login/
POST /api/auth/token/refresh/

Challenges

POST   /api/challenges/
GET    /api/challenges/
GET    /api/challenges/{id}/
PATCH  /api/challenges/{id}/route/

Filtering examples:

/api/challenges/?category=water
/api/challenges/?district=Ranchi
/api/challenges/?status=submitted

Universities

GET  /api/universities/
POST /api/universities/{id}/form-team/

Industry

GET  /api/industry-partners/
POST /api/partnerships/

Projects

GET   /api/projects/{team_id}/milestones/
POST  /api/projects/{team_id}/milestones/
PATCH /api/milestones/{id}/approve/

Analytics

GET /api/analytics/summary/

Admin Management

Admin APIs should provide CRUD operations for:

Users
Districts
Categories
Challenges
Universities
Industry Partners
Project Teams
Partnerships
Milestones
Audit Logs

All admin-only endpoints must enforce IsGovAdmin.

Frontend Pages

Authentication

/login
/register

Citizen

/citizen/submit-challenge
/citizen/my-challenges

Government Admin

/admin/dashboard
/admin/challenges
/admin/universities
/admin/industry
/admin/users
/admin/master-data
/admin/audit-logs

HEI SPOC

/hei/assigned-challenges
/hei/my-teams

Industry Partner

/industry/browse-projects

Design System

The interface follows an official institutional dashboard style.

Principles

Clean

Professional

Functional

Dashboard-first

Government-oriented

Responsive

Easy to scan

Consistent spacing

Clear status indicators

Avoid

Neon gradients

Excessive glassmorphism

Futuristic AI visuals

Marketing hero sections

Excessive animations

SaaS promotional layouts

The application should feel like an official digital governance and
innovation-management system.

Responsive Design

The complete application should work on:

Desktop

Laptop

Tablet

Mobile

The citizen workflow is particularly important for mobile users.

Mobile support includes:

Responsive forms

Mobile navigation

Touch-friendly buttons

Responsive cards

Horizontal table scrolling where required

Single-column forms on small screens

Data Integrity

Protect historical and relational data.

Examples:

Referenced University
        ↓
Do not blindly delete
        ↓
Deactivate instead

Similarly:

Referenced districts should normally be deactivated.

Referenced categories should normally be deactivated.

Users with historical records should normally be deactivated.

The currently logged-in government admin cannot delete their own
account.

The last active government administrator must not be removed
accidentally.

End-to-End Demonstration

1. Citizen
   ↓
   Creates a societal challenge

2. Government Admin
   ↓
   Reviews and categorizes the challenge
   ↓
   Assigns it to a suitable university

3. HEI SPOC
   ↓
   Forms a project team

4. Faculty Mentor
   ↓
   Guides the team
   ↓
   Manages milestone progress

5. Industry / CSR Partner
   ↓
   Offers mentorship, funding or pilot support

6. Project Team
   ↓
   Completes milestones
   ↓
   Submits evidence

7. Faculty / Government Admin
   ↓
   Approves milestones

8. Government Admin
   ↓
   Monitors completion and analytics

Research and Innovation Direction

The platform is structured around:

Existing Systems
      ↓
Actual Failure Points
      ↓
Research Gap
      ↓
Proposed Mechanism
      ↓
Hypothesis
      ↓
Evaluation
      ↓
Expert Validation
      ↓
Real-world Pilot
      ↓
Measurable Impact

The MVP provides the digital infrastructure required to collect
structured evidence for this research pipeline.

MVP Scope

The current MVP intentionally excludes:

ML/AI embedding models

Payment gateway

Email/notification system

Multilingual support

Real geospatial/PostGIS functionality

Complex map visualization

Separate student accounts

The categorization mechanism remains keyword-based and explainable.

Future Expansion

Possible future extensions include:

Advanced semantic problem similarity

AI-assisted knowledge retrieval

Problem-family detection

Institution capability matching

Impact prediction

Outcome benchmarking

Evidence-based solution reuse

Advanced analytics

Geographic visualization

Multilingual citizen interaction

Notification and communication workflows

PostgreSQL production deployment

Dedicated student accounts

These are future extensions and are not required for the current MVP.

Testing Checklist

Before declaring the application ready for demonstration, verify:

JWT login and refresh

Registration for all supported roles

Citizen challenge submission

Challenge categorization

Government review

Government routing

HEI team formation

Faculty mentor workflow

Industry support workflow

Partnership lifecycle

Milestone creation

Milestone submission

Milestone approval

Challenge completion

Analytics

Admin CRUD operations

Master-data management

Audit-log generation

Delete/deactivation protections

Mobile responsiveness

API validation

Loading and error states

Project Status

MVP — Full-stack development and integration

The project should be considered demonstration-ready only after the
complete challenge-to-project workflow and all major role-based
operations have been tested end-to-end.

SIH Reference

Problem Statement: SIH 26043

Project: Societal Innovation Collaboration Portal

Purpose: Build a structured digital ecosystem connecting societal
problems with government, academia, industry and implementation
resources.
