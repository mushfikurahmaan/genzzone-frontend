# Genzzone Frontend

Next.js frontend for the Genzzone e-commerce platform built with React, TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Product Listing**: Browse all available products with category filtering
- **Product Details**: View detailed product information
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Confirmation**: View order details
- **Best Selling Products**: Featured products section
- **Responsive Design**: Mobile-first responsive layout

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality component library
- **Axios** - HTTP client for API requests
- **Lucide React** - Icon library

## Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-frontend-repo-url>
cd genzzone-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_META_PIXEL_ID=your-meta-pixel-id
```

For production, set this to your Railway backend URL:
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_META_PIXEL_ID=your-meta-pixel-id
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Project Structure

```
genzzone-frontend/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── products/          # Products pages
│   │   ├── [id]/         # Product detail page
│   │   └── page.tsx      # Products listing
│   ├── cart/             # Shopping cart
│   │   └── page.tsx      # Cart page
│   ├── order/            # Order page
│   └── orders/           # Order confirmation
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── Navbar.tsx        # Navigation
│   ├── Footer.tsx         # Footer
│   ├── Hero.tsx          # Hero section
│   └── ProductCard.tsx   # Product card component
├── contexts/             # React contexts
│   └── CartContext.tsx   # Cart state management
└── lib/                  # Utilities
    ├── api.ts            # API service layer
    └── utils.ts          # Utility functions
```

## API Integration

The frontend communicates with the Django backend through RESTful APIs:

- **Products**: `GET /api/products/`, `GET /api/products/{id}/`
- **Best Selling**: `GET /api/best-selling/`
- **Notifications**: `GET /api/notifications/active/`
- **Cart**: `GET /api/cart/`, `POST /api/cart/add/`, `PUT /api/cart/items/{id}/`, `DELETE /api/cart/items/{id}/remove/`
- **Orders**: `POST /api/orders/create/`

All API calls use session-based authentication (cookies) with `withCredentials: true`.

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. In Vercel project settings:
   - Set **Root Directory** to `/` (or leave empty)
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL` = `https://your-backend.railway.app`
     - `NEXT_PUBLIC_META_PIXEL_ID` = your Meta Pixel ID
4. Deploy!

Vercel will automatically:
- Detect Next.js framework
- Install dependencies
- Build the project
- Deploy to production

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta Pixel ID for PageView tracking | No (pixel disabled if unset) |

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The production build will be in the `.next` directory.

## Configuration

### API URL Configuration

The API URL is configured in:
- `lib/api.ts` - Base API configuration
- `next.config.ts` - Image remote patterns for product images

Update `NEXT_PUBLIC_API_URL` environment variable to point to your backend.

### Image Configuration

Product images are loaded from the backend. The `next.config.ts` file is configured to allow images from your backend domain.
