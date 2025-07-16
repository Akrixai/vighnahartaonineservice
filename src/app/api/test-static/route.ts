import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    
    // Test files to check
    const testFiles = [
      'vignaharta.jpg',
      'vignaharta.png',
      'vignaharta.svg',
      'vignaharta-logo.svg'
    ];
    
    const results = [];
    
    for (const file of testFiles) {
      try {
        const filePath = path.join(publicDir, file);
        const stats = await fs.stat(filePath);
        
        // Try to read first few bytes to verify it's not corrupted
        const buffer = await fs.readFile(filePath);
        const isValidImage = buffer.length > 0;
        
        results.push({
          file,
          exists: true,
          size: stats.size,
          path: `/${file}`,
          fullPath: filePath,
          isValidImage,
          firstBytes: buffer.slice(0, 10).toString('hex'),
          mimeType: file.endsWith('.jpg') ? 'image/jpeg' : 
                   file.endsWith('.png') ? 'image/png' : 
                   file.endsWith('.svg') ? 'image/svg+xml' : 'unknown'
        });
      } catch (error) {
        results.push({
          file,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          path: `/${file}`
        });
      }
    }
    
    // Also test if we can serve a simple static file
    const testStaticAccess = async () => {
      try {
        const response = await fetch(`${request.nextUrl.origin}/vignaharta.jpg`);
        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          canAccess: response.ok
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          canAccess: false
        };
      }
    };
    
    const staticTest = await testStaticAccess();
    
    return NextResponse.json({
      success: true,
      message: 'Static file test completed',
      publicDir,
      files: results,
      staticAccessTest: staticTest,
      serverInfo: {
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        nodeVersion: process.version
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
