import { NextResponse } from 'next/server';

export async function GET(request) {
  // Get the authorization code from the query string
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const accessToken = url.searchParams.get('access_token');
  
  console.log('Google callback received:', { code: code ? 'present' : 'not present', accessToken: accessToken ? 'present' : 'not present' });
  
  // In a real implementation, you would exchange the code for tokens here
  
  // For now, simply redirect back to the application
  // With the token (if present) in the query string
  let redirectUrl = new URL('/', request.url);
  
  if (accessToken) {
    redirectUrl.searchParams.append('token_success', 'true');
    redirectUrl.searchParams.append('access_token', accessToken);
  } else if (code) {
    // If we have a code but no token, still indicate success
    // In a real implementation, you would exchange the code for a token here
    redirectUrl.searchParams.append('token_success', 'true');
    redirectUrl.searchParams.append('from_code', 'true');
  } else {
    redirectUrl.searchParams.append('token_error', 'true');
  }
  
  console.log('Redirecting to:', redirectUrl.toString());
  
  return NextResponse.redirect(redirectUrl);
}
