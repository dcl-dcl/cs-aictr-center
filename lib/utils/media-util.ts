
// import { GCS } from '@/lib/gcs';


// export async function uploadFileToGCS(file: File, bucketName: string, destinationBlobName: string): Promise<string> {
//     const arrayBuffer = await file.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);
    
//     const gcs = new GCS();
//     await gcs.upload(bucketName, destinationBlobName, buffer);
    
//     return `gs://${bucketName}/${destinationBlobName}`;
// }


import formidable from 'formidable';
import fs from 'fs';

export async function fileToBase64(file: File | formidable.File): Promise<string> {
    let buffer: Buffer;
    
    if (file instanceof File) {
        // 浏览器 File 对象
        const arrayBuffer = await file.arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
    } else {
        // formidable.File 对象
        buffer = await fs.promises.readFile(file.filepath);
    }
    
    return buffer.toString('base64');
}