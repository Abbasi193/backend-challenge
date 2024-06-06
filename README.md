# How to Run This Application

These instructions will guide you through setting up and running the application using Docker Compose.

## Prerequisites

- [Docker](https://www.docker.com/) installed on your machine
- Git installed to clone the repository

## Steps

1. Clone the repository to your local machine:
   ```bash
   git clone https://github.com/Abbasi193/backend-challenge.git

2. Navigate to the project folder:
   ```bash
   cd backend-challenge
   
3. (Optional) Update CLIENT_ID and CLIENT_SECRET in docker-compose file:
   Obtain these from microsoft by using this [Guide](https://github.com/Abbasi193/backend-challenge/wiki/Register-application-with-microsoft-azure)


3. (Optional) Enable callbacks from microsoft for graph api implementation, not needed for IMAP:
   install ngrok from [Ngrok's official website](https://ngrok.com/docs/getting-started/).
   ```bash
   ngrok http 3000

Use forward URL (e.g., http://abcd1234.ngrok.io) as WEBHOOK_URL in the docker-compose file.
  
5. Build and run the Docker containers using Docker Compose:
   ```bash
   docker-compose up --build

Once the containers are up and running, you can access the application at [http://localhost:3000/](http://localhost:3000/)
in your web browser.
