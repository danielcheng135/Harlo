# Harlo

**AI-powered customer engagement and website chatbot platform**

Harlo is a full-stack SaaS application designed to help businesses engage website visitors, answer customer questions, capture leads, and manage customer conversations through configurable AI-powered agents.

The platform combines conversational AI, retrieval-augmented generation (RAG), embeddable website chatbots, customer management tools, third-party integrations, and subscription billing within a unified dashboard.

Built with **Next.js, TypeScript, React, Supabase, OpenAI, and Stripe**.

## Overview

Harlo enables businesses to configure AI agents that interact with website visitors using organization-specific information.

Businesses can provide knowledge sources, customize chatbot behavior, manage conversations, capture leads, and monitor their usage through a centralized dashboard.

The application uses a multi-tenant architecture with organization-based data separation and role-based access controls.

## Features

### AI-Powered Customer Conversations

- Configurable conversational AI agents powered by OpenAI.
- Website chatbot widgets for customer interactions.
- Customizable agent instructions and conversation behavior.
- Conversation persistence and management.
- Support for lead capture and conversation handoff workflows.
- Organization-specific chatbot configuration.

### Retrieval-Augmented Generation (RAG)

Harlo supports knowledge-grounded AI responses using business-specific information.

Supported knowledge source types include:

- Website URLs
- Uploaded documents
- Manually entered text

The knowledge system processes source content into chunks, generates vector embeddings, and stores the resulting information in Supabase PostgreSQL with `pgvector`.

Relevant content can be retrieved to provide context when generating AI responses.

The repository also includes scheduled website knowledge synchronization functionality.

### Business Dashboard

The dashboard provides interfaces for:

- AI agent configuration
- Conversation management
- Customer leads
- Analytics
- Knowledge sources
- Third-party integrations
- Team management
- Organization settings
- Subscription and billing management

### Embeddable Chatbot Widget

Harlo includes website chatbot functionality that connects external website visitors to an organization's AI agent.

The application includes configuration and domain-validation mechanisms for controlling where chatbot widgets can operate.

### Subscription Billing

Stripe integration supports SaaS billing workflows, including:

- Subscription checkout
- Billing management
- Payment-related webhooks
- Usage and message-credit tracking
- Credit recharge workflows
- Billing notifications

### Third-Party Integrations

The repository contains integration infrastructure for external business services, including OAuth-related configuration for providers such as Calendly, Cal.com, Jobber, HubSpot, Slack, Mailchimp, and Google services.

Integration availability and functionality depend on provider configuration and credentials.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js Route Handlers |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Vector Search | pgvector |
| AI | OpenAI API |
| Payments | Stripe |
| Validation | Zod |
| Deployment | Compatible with Vercel |
| Version Control | Git, GitHub |

## System Architecture

Harlo separates its user interface, backend services, AI processing, and data persistence.

```text
                    Website Visitors
                           |
                           v
                  Embeddable Chatbot
                           |
                           v
                   Next.js API Layer
                           |
                           v
                    Agent Processing
                      /          \
                     v            v
              Knowledge        OpenAI API
              Retrieval
                  |
                  v
           Supabase PostgreSQL
           + Vector Embeddings

                Business Users
                       |
                       v
               Next.js Dashboard
                       |
             +---------+---------+
             |         |         |
             v         v         v
          Supabase   Stripe   Integrations
```

### Core Application Components

**Frontend (`app/`, `components/`)**

Implements the website, dashboard, chatbot interfaces, onboarding flows, and account management screens.

**API (`app/api/`)**

Contains server-side endpoints for chat processing, knowledge management, leads, billing, conversations, integrations, and other application operations.

**Business Logic (`lib/`)**

Contains shared application services, including AI processing, knowledge retrieval, billing, Supabase clients, and supporting utilities.

**Database (`supabase/migrations/`)**

Contains SQL migrations defining the application's relational data model, policies, and supporting database functionality.

**Middleware (`middleware.ts`)**

Connects request handling with session-management functionality.

## AI Chat Processing

At a high level, the website chatbot interaction follows this workflow:

1. A website visitor submits a message through the chatbot interface.
2. The Next.js chat endpoint validates the request and identifies the selected AI agent.
3. The application checks relevant configuration and permitted widget origins.
4. The agent-processing layer handles the conversation.
5. Knowledge retrieval and OpenAI-based response generation are used as applicable.
6. The application returns the generated response and associated conversation information.

The system also includes message-credit and billing-limit handling.

## Database Design

Harlo uses Supabase PostgreSQL for application data and organization-specific records.

The schema includes entities for organizations, memberships, AI agents, knowledge sources, knowledge chunks, conversations, messages, and leads.

The database architecture incorporates:

- Relational tables and foreign keys
- Organization-based records
- Membership roles
- Row Level Security (RLS)
- Vector embeddings for knowledge retrieval
- Incremental SQL schema migrations

## Local Development

### Prerequisites

- Node.js and npm
- A Supabase project
- An OpenAI API key
- Stripe credentials for billing functionality
- Credentials for any additional integrations being enabled

### 1. Clone the repository

```bash
git clone https://github.com/danielcheng135/Harlo.git
cd Harlo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the included template:

```bash
cp .env.example .env.local
```

Configure the required application services, including the Supabase project URL and keys, OpenAI API key, and application URL.

The template also documents optional or feature-dependent settings for Stripe, email delivery, scheduled jobs, and third-party integrations.

**Never commit real API keys, service-role keys, webhook secrets, or OAuth client secrets.**

### 4. Configure Supabase

Provision a Supabase project and apply the SQL migrations in `supabase/migrations/` in the appropriate order.

Some application functionality requires corresponding database schema, authentication, storage, and external service configuration.

### 5. Run the development server

```bash
npm run dev
```

Open:

`http://localhost:3000`

The application should start locally once the required dependencies and environment configuration are in place. Individual features may require additional provider configuration.

## Development Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run the configured lint command |
| `npm run typecheck` | Run TypeScript type checking |

## Security Considerations

Harlo includes several application-level security mechanisms:

- Supabase authentication and session management
- Organization membership and role checks
- PostgreSQL Row Level Security
- Server-side validation for selected protected operations
- Widget origin restrictions
- Environment-based configuration for privileged credentials

These mechanisms should be reviewed and tested before production deployment. Their presence does not constitute an independent security audit.

## Development Approach

Harlo was developed through an AI-assisted software development workflow using OpenAI Codex.

Project direction, feature planning, technology selection, and architectural requirements were guided by me, with AI-assisted generation and iteration used extensively during implementation.

The project explores how modern AI development tools can be used to build and iterate on full-stack SaaS applications.

## Future Improvements

Potential areas for further development include:

- Expanded automated unit and integration testing
- End-to-end testing of core customer workflows
- Improved observability and application monitoring
- Additional third-party integrations
- Performance optimization for knowledge retrieval
- Expanded developer and deployment documentation
- Further security testing and hardening

## Project Status

Harlo is an actively developed AI-powered SaaS codebase.

The repository demonstrates the integration of modern frontend development, server-side APIs, relational databases, vector search, external services, and AI-driven conversational workflows.

Feature availability depends on the configured environment and external service credentials.
