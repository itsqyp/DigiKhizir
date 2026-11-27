# DigiKhizir

### Know the danger. Find safety. Get help.

**DigiKhizir** is a disaster preparedness and emergency assistance platform designed to support vulnerable and disaster-prone communities in Bangladesh. Especially the communities living in the south.

It helps residents access disaster alerts, locate nearby shelters and relief resources, find animal shelters, and request emergency assistance — all through a simple, accessible interface.

Built for **Code for Humanity**, DigiKhizir aims to make essential disaster-related information and emergency support more accessible to communities that are often overlooked.

---

## The Problem

Bangladesh is highly vulnerable to natural disasters, particularly floods, cyclones, and other extreme weather events.

For people living in vulnerable and rural communities, accessing reliable emergency information and assistance can be difficult.

Some of the challenges include:

- Limited access to timely disaster information.
- Difficulty finding nearby safe shelters during emergencies.
- Lack of accessible information about food, water, and relief resources.
- Limited emergency communication and rescue coordination.
- Insufficient attention to the safety of livestock and domestic animals during disasters.

When a disaster strikes, access to the right information can make a significant difference.

## My Solution

DigiKhizir brings essential disaster preparedness and emergency assistance features together in one platform.

It provides a resident-facing interface for people seeking help and dedicated dashboards for responders and administrators who coordinate emergency operations.

My goal is simple: **make it easier for people to know the danger, find safety, and get help when they need it most.**

---

## Features

### For Residents

- **Disaster Alerts:** View active disaster alerts and warnings.
- **Nearby Human Shelters:** Find available human shelters and their facilities.
- **Food & Relief Resources:** Explore relief distribution points and available supplies.
- **Animal Shelters:** Find designated facilities for pets, livestock, and poultry.
- **Emergency SOS:** Send an emergency request with GPS coordinates and additional details.
- **Location Detection:** Use device location to help identify where assistance is needed.
- **Bilingual Interface:** Switch between English and Bangla for improved accessibility.

### For Responders

- **SOS Management:** View incoming emergency requests.
- **Request Acknowledgement:** Claim pending requests and take responsibility for them.
- **Status Updates:** Track requests through their response lifecycle.
- **Request Details:** Access emergency descriptions, contact information, and location details.

### For Administrators

- **Dashboard:** Monitor key platform statistics.
- **Disaster Alert Management:** Create and manage disaster alerts.
- **Shelter Management:** Manage human shelters and their facilities.
- **Relief Management:** Manage food distribution points and inventory.
- **Animal Shelter Management:** Manage animal shelters and their facilities.
- **Responder Coordination:** Monitor and manage incoming SOS requests.

---

## Built With

| Technology      | Purpose                                |
| --------------- | -------------------------------------- |
| React           | Frontend user interface                |
| TypeScript      | Type-safe development                  |
| Vite            | Frontend development and build tooling |
| Tailwind CSS v4 | Styling and responsive UI              |
| React Router    | Frontend navigation                    |
| Lucide React    | Icons                                  |
| Hono            | Backend API framework                  |
| Node.js         | Backend runtime                        |
| PostgreSQL      | Database                               |
| Prisma ORM      | Database access and migrations         |
| JWT             | Authentication                         |
| bcryptjs        | Password hashing                       |
| Docker          | Local PostgreSQL environment           |

---

## Project Architecture

DigiKhizir uses a separate frontend and backend architecture.

```text
DigiKhizir/
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   ├── pages/
│   │   ├── admin/
│   │   ├── responder/
│   │   └── resident/
│   ├── translations/
│   └── App.tsx
│
├── server/
│   ├── prisma/
│   └── src/
│       ├── lib/
│       ├── routes/
│       ├── scripts/
│       └── index.ts
│
└── README.md
```

The frontend communicates with the Hono backend through REST API endpoints. The backend handles authentication, database operations, emergency requests, alerts, shelters, and relief resources.

---

## Loading it up

Follow these instructions to run DigiKhizir locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/itsqyp/DigiKhizir.git
cd DigiKhizir
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Configure environment variables

Create a `.env` file inside the `server/` directory.

Add the following variables:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/digikhizir"
JWT_SECRET="your-secure-secret"
```

Replace the database credentials with your local PostgreSQL configuration. Use a secure, private JWT secret.

### 5. Set up the database

Make sure your PostgreSQL database is running.

Run the Prisma migrations:

```bash
npx prisma migrate deploy
```

Generate the Prisma Client:

```bash
npx prisma generate
```

If you are setting up a fresh development database and have the migration files available, you can alternatively use:

```bash
npx prisma migrate dev
```

### 6. Start the backend

From the `server/` directory:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:3000
```

### 7. Start the frontend

Open another terminal, return to the project root, and run:

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

---

## User Roles

DigiKhizir provides different access levels for different users.

| Role          | Access                                               |
| ------------- | ---------------------------------------------------- |
| Resident      | Public disaster information and emergency SOS        |
| Responder     | Emergency request monitoring and response management |
| Administrator | Platform management and administrative operations    |

Residents can access the public-facing features without creating an account. Responders and administrators must authenticate to access their respective dashboards.

---

## Accessibility

Accessibility is an important part of DigiKhizir.

The platform includes:

- English and Bangla language support.
- Responsive layouts for different screen sizes.
- Location-based assistance.
- Simple navigation and clear emergency actions.
- A resident-facing experience designed to reduce barriers to accessing essential services.

---

## Important Demo Notice

DigiKhizir is currently a hackathon prototype.

Some shelter locations, relief inventory records, contact information, and other resources may contain **synthetic demonstration data**. They should not be treated as verified real-world emergency resources.

The platform demonstrates how disaster-related information and emergency coordination could work. It is not yet an officially connected emergency response system.

An SOS request being successfully submitted does not necessarily mean that a rescue team has been dispatched.

Always follow verified instructions from local authorities during an actual emergency.

---

## Future Improvements

There is still plenty of room to grow.

Some planned improvements include:

- Progressive Web App (PWA) support.
- Offline access to previously loaded essential information.
- Offline SOS request queuing with clear delivery status.
- Real-time notifications for emergency requests.
- Integration with verified disaster warning sources.
- Live resource availability and inventory updates.
- Improved map-based navigation to shelters.
- A dedicated desktop application for responders and administrators.

---

## Built for Humanity

DigiKhizir was developed for **Code for Humanity**, a hackathon focused on using technology to address real-world challenges and improve the lives of underserved and underrepresented communities.

We believe that access to information, safety, and emergency assistance should not depend on where someone lives.

**Know the danger. Find safety. Get help.**

---

_Made with ❤️ for communities that deserve to be safer._
