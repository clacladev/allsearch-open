# Test User Authentication

When using Chrome to simulate a user session, you can authenticate a test user inside the application with the following method.

## Steps

1. Open the home page at `https://localhost:3000`
2. Click the **Start Free Trial** button on the top right
3. Fill in the email `test@allsearch.io`
4. On a different tab, open `https://localhost:3000/api/admin/magic-auth` and get the OTP code from the response
5. Switch back to the Sign In page previously open and fill in the copied OTP code
6. You should be redirected to your first project's Overview page
