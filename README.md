## Deployment Guide

### Requirements

#### Build-time

- Docker (>= 17.12.0, recommended: 18.09.0)
- Docker Compose (>= 1.21.0, recommended: 1.23.1)

#### Run-time

- Docker (>= 19.03.5)

### Running in local machine

Just run with `make up`.

### Build the Docker images and run on another host

1. run `make export`
2. copy generated images from `images` directory to the remote host
3. use `docker load` to load these images
4. run both containers within the same Docker network

## Acceptance Criteria

- [] ~~A blog post will show a title, article text (plain text) and an author name~~
- [] ~~Comments are made on blog posts and show comment text (plain text) and an
  author name~~

## Non-functional Requirements

- [] ~~The code should be production ready and could be supported by a team~~
- [X] ~~The application must have a build system~~
  - [X] ~~The application build should be built or compiled in a docker container~~
  - [X] ~~The application build should produce a docker container image as an artifact~~
  - [] ~~The application should not have any runtime dependencies~~


## Testing

Just run `make test`.

Note: only E2E testing is currectly available.

## Tasks

### Stage 0 - Preparation

- [X] ~~Clarify requirements~~
- [X] ~~Define data schema~~
- [X] ~~Architectural pattern review~~
- [X] ~~Access Pattern for back-end~~

### Stage 1 - MVP

- [X] ~~Backend Skeleton~~
  - [X] ~~ Mock database structure~~
  - [x] ~~ HTTP Endpoint (Blog and Comment endpoint) ~~
  - [x] ~~Integration of database ~~
  - [] ~~ E2E Test integration (mocha, chai)~~
  - [x] ~~ Documentation ( Swagger UI, added simple Api Doc at ./apiDoc.yaml )~~
