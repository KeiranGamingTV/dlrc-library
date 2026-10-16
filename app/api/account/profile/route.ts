import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'You must sign in first.' },
      { status: 401 }
    );
  }

  let body: {
    displayName?: unknown;
    publicEnabled?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  if (
    typeof body.displayName !== 'string' ||
    typeof body.publicEnabled !== 'boolean'
  ) {
    return NextResponse.json(
      { error: 'Invalid profile settings.' },
      { status: 400 }
    );
  }

  const displayName = body.displayName.trim();

  if (
    displayName.length !== 0 &&
    (displayName.length < 2 || displayName.length > 40)
  ) {
    return NextResponse.json(
      {
        error:
          'Your display name must be empty or between 2 and 40 characters.',
      },
      { status: 400 }
    );
  }

  if (body.publicEnabled && displayName.length < 2) {
    return NextResponse.json(
      {
        error:
          'Choose a display name before making your profile public.',
      },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from('profiles')
    .update({
      display_name: displayName || null,
      public_profile_enabled: body.publicEnabled,
    })
    .eq('id', user.id);

  if (error) {
    console.error('Unable to update contributor profile:', error);

    return NextResponse.json(
      { error: 'Unable to save your profile settings.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    displayName: displayName || '',
    publicEnabled: body.publicEnabled,
  });
}
