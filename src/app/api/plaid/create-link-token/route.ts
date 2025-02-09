import { NextRequest, NextResponse } from 'next/server';
import { client } from "../../../../utils/plaidClient";
import { Products, CountryCode } from 'plaid';

export async function POST(req: NextRequest) {
  try {
    const { client_user_id } = await req.json();
    const response = await client.linkTokenCreate({
      user: { client_user_id },
      client_name: 'AstraWise',
      products: [Products.Auth, Products.Transactions, Products.Identity],
      country_codes: [CountryCode.Us, CountryCode.Ca],
      language: 'en',
    });
    return NextResponse.json({ link_token: response.data.link_token });
  } catch (error) {
    return NextResponse.json({ error: error }, { status: 500 });
  }
}