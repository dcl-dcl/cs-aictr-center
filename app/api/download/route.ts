import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/auth-middleware';

export const POST = withAuth(async (
    request: AuthenticatedRequest
): Promise<NextResponse> => {
    try {
        const { url, filename, mimeType } = await request.json();
        if (!url) {
            return NextResponse.json(
                { error: 'URL不可为空！' },
                { status: 400 }
            );
        }
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        const contentType = mimeType || response.headers.get('content-type') || 'image/png';

        const headers = new Headers();
        headers.set('Content-Type', contentType);
        headers.set('Content-Disposition', `attachment; filename="${filename || 'download.png'}"`);
        headers.set('Cache-Control', 'no-cache');
        return new NextResponse(Buffer.from(buffer), { headers });

    } catch (error) {
        return NextResponse.json(
            { error: `下载失败，${error}` },
            { status: 500 }
        )
    }
});