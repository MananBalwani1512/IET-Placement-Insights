# IET Placement Insights Backend

Welcome to the IET Placement Insights Backend repository! This project provides the backend services for the IET Placement Insights application using Node.js, Express, and MySQL.

## Tech Stack

- **Node.js**: JavaScript runtime for building server-side applications.
- **Express**: Web framework for Node.js, designed for building web applications and APIs.
- **MySQL**: Relational database management system for storing application data.

## Getting Started

Follow these steps to set up and run the backend:

### Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) and [MySQL](https://www.mysql.com/) installed on your machine.
- Basic knowledge of working with databases and Node.js applications.

### Steps to Run the Backend

1. **Clone the Repository**

   ```bash
   git clone https://github.com/IETPlacementInsights/IET-Placement-Insights-Backend-
   cd iet-placement-insights-backend
2. **Update Credentials**
    Create a .env file and write credentials : 

    EMAIL_ID=YOUR_EMAIL_ID
    PASSWORD=YOUR_PASSWORD
    DATABASE_USER_NAME=YOUR_DATABASE_USER_NAME
    DATABASE_PASSWORD=YOUR_DATABASE_PASSWORD
    DATABASE_HOST=YOUR_DATABASE_HOST
    DATABASE_NAME=YOUR_DATABASE_NAME
    STUDENT_PORTAL_BASE_URL=http://localhost:5173
    ADMIN_PORTAL_BASE_URL=http://localhost:3000

3. **Initialize Database**
    ```bash
   cd SQL   
   node Database.js
4. **Run Server**
    ```bash
   cd ../server   
   node server.js

## Thank You
## Happy Coding !!!