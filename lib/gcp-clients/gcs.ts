import { Storage } from '@google-cloud/storage';
import path from 'path';

export class GCS {
    private storageClient: Storage;

    constructor(googleApplicationCredentials?: string) {
        this.storageClient = new Storage({
            // SA json file path
            keyFile: googleApplicationCredentials || process.env.GOOGLE_APPLICATION_CREDENTIALS,
        });
    }

    private getBlob(
        bucketName: string,
        destinationBlobName: string
    ) {
        const bucket = this.storageClient.bucket(bucketName);
        return bucket.file(destinationBlobName);
    }

    async uploadStream(
        bucketName: string,
        destinationBlobName: string,
        readableStream: NodeJS.ReadableStream
    ): Promise<void> {
        const blob = this.getBlob(bucketName, destinationBlobName);
        const writeStream = blob.createWriteStream({
            resumable: false, // For smaller files or when resumable uploads are not needed
            metadata: { contentType: 'application/octet-stream' } // Adjust content type as needed
        });

        return new Promise((resolve, reject) => {
            readableStream.pipe(writeStream)
                .on('finish', () => {
                    console.log(`Uploaded stream to gs://${bucketName}/${destinationBlobName}`);
                    resolve();
                })
                .on('error', (err) => {
                    console.error(`Error uploading stream: ${err}`);
                    reject(err);
                });
        });
    }

    async upload(
        bucketName: string,
        destinationBlobName: string,
        data: string | Buffer
    ): Promise<void> {
        const blob = this.getBlob(bucketName, destinationBlobName);
        await blob.save(data);
        console.log(`Uploaded data to gs://${bucketName}/${destinationBlobName}`);
    }

    /**
     * 生成文件的签名URL
     * @param bucketName 存储桶名称
     * @param blobName 文件名称
     * @param expirationMinutes 过期时间，单位分钟，默认24小时
     * @returns 签名URL
     */
    async generateSignedUrl(
        bucketName: string,
        blobName: string,
        expirationMinutes: number = 60 * 24
    ): Promise<string> {
        const blob = this.getBlob(bucketName, blobName);
        const [url] = await blob.getSignedUrl({
            version: 'v4',
            action: 'read',
            expires: Date.now() + expirationMinutes * 60 * 1000, // milliseconds
            responseDisposition: `attachment; filename="${path.basename(blobName)}"`,
            // contentType: 'video/mp4' // 根据实际视频格式调整，如果需要直接在浏览器中播放，可以设置为 video/mp4
        });
        console.log(url);
        return url;
    }

    async gcsUriToSignedUrl(gcsUri:string): Promise<string> {
        const match = gcsUri.match(
            /^gs:\/\/([^\/]+)\/(.+)$/
        );
        if (match) {
            const bucketName = match[1];
            const blobName = match[2];
            console.log("gcsUri", gcsUri, "bucketName", bucketName, "blobName", blobName);
            const signedUrl = await this.generateSignedUrl(bucketName, blobName);
            return signedUrl;
        } else {
            throw new Error("Invalid GCS URI");
        }
    }

    /**
     * 检查文件是否存在
     * @param bucketName 存储桶名称
     * @param blobName 文件名称
     * @returns 文件是否存在
     */
    async fileExists(bucketName: string, blobName: string): Promise<boolean> {
        const blob = this.getBlob(bucketName, blobName);
        const [exists] = await blob.exists();
        return exists;
    }

    /**
     * 下载文件
     * @param bucketName 存储桶名称
     * @param sourceBlobName 文件名称
     * @param destinationFileName 本地文件名称
     * @returns 本地文件名称
     */
    async downloadFile(bucketName: string, sourceBlobName: string, destinationFileName: string): Promise<string> {
        const blob = this.getBlob(bucketName, sourceBlobName);
        await blob.download({
            destination: destinationFileName,
        });
        console.log(`Downloaded gs://${bucketName}/${sourceBlobName} to ${destinationFileName}`);
        return destinationFileName;
    }

    /**
     * 列出存储桶中的所有文件
     * @param bucketName 存储桶名称
     * @returns 文件名称列表
     */
    async listFiles(bucketName: string): Promise<string[]> {
        const [files] = await this.storageClient.bucket(bucketName).getFiles();
        return files.map(file => file.name);
    }

}