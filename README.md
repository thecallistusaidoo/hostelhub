🚀 Getting Started
Prerequisites
Before you begin, ensure you have the following installed:

Node.js (v18.0.0 or higher)
npm (v9.0.0 or higher) or yarn (v1.22.0 or higher)
Git for version control

## Google Maps API Setup
The hostel location selection feature requires a Google Maps API key:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Maps JavaScript API** and **Geocoding API**
4. Create credentials (API Key)
5. Add your API key to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```
6. Optionally restrict the API key to your domain for security

## Paystack Payment Integration Setup
The payment system uses Paystack for secure transactions:

1. Sign up at [Paystack](https://paystack.com/)
2. Create a new business account
3. Get your API keys from the dashboard
4. Add to `backend/.env`:
   ```
   PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
   ```
5. Add to `frontend/.env.local`:
   ```
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_public_key_here
   ```
6. For production, use live keys and set webhook URL to `https://yourdomain.com/api/payments/webhook`

Installation
Clone the repository
git clone https://github.com/thecallistusaidoo/hostelhub.git
cd hostelhub
Install dependencies
npm install
or using yarn:

yarn install
Development
Start the development server with hot module replacement (HMR):

npm run dev
The application will be available at http://localhost:3000

Building for Production
Create an optimized production build:

npm run build
Preview the production build locally:

npm run preview
